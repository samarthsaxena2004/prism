import asyncio
import base64
import json
import time
import uuid
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pipeline import run_prism_pipeline
from comparison import run_gpu_pipeline
from storage import upload_image, save_document, get_records, get_record_detail

app = FastAPI(title="Prism API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    image_b64: str
    facility_name: str = "Demo Facility"
    form_type: str = "medical-records"


@app.get("/health")
async def health():
    return {"status": "ok", "model": "gemma-4-31b", "provider": "cerebras"}


@app.post("/api/upload")
async def upload_form(file: UploadFile = File(...)):
    """Accept a form image or PDF, return base64 for the analyze endpoint."""
    content = await file.read()
    
    if file.filename.lower().endswith(".pdf") or file.content_type == "application/pdf":
        try:
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            if len(doc) > 0:
                page = doc[0]
                pix = page.get_pixmap(dpi=150)
                content = pix.tobytes("jpeg")
            doc.close()
        except Exception as e:
            print(f"Warning: Failed to parse PDF with PyMuPDF: {e}")

    b64 = base64.b64encode(content).decode()
    return {"image_b64": b64, "filename": file.filename, "size": len(content)}


@app.post("/api/analyze")
async def analyze_document(req: AnalyzeRequest):
    """
    Main endpoint. Runs the SAME 5-agent workflow on two stacks in parallel —
    Cerebras (gemma-4-31b) and a GPU-hosted model via OpenRouter — and streams
    real, measured events from both. Every number on the speed panel is a real
    measurement; nothing is simulated or hardcoded.

    Event schema: see prism-api/CLAUDE.md. Each pipeline's events carry an
    `engine: "cerebras" | "gpu"` tag so the frontend can route them to the
    correct execution column.
    """
    doc_id = str(uuid.uuid4())

    try:
        await save_document(doc_id, req.facility_name, req.form_type)
    except Exception as e:
        print(f"Warning: could not create document row: {e}")

    async def event_stream():
        start_time = time.time()
        queue: asyncio.Queue = asyncio.Queue()

        async def pump_cerebras():
            try:
                if req.form_type == "dialysis_monitoring":
                    from pipeline import run_prism_pipeline
                    pipeline_coroutine = run_prism_pipeline(
                        image_b64=req.image_b64,
                        doc_id=doc_id,
                        facility_name=req.facility_name,
                        form_type=req.form_type,
                    )
                else:
                    from research_pipeline import run_research_pipeline
                    pipeline_coroutine = run_research_pipeline(
                        image_b64=req.image_b64,
                        doc_id=doc_id,
                        facility_name=req.facility_name,
                        form_type=req.form_type,
                    )
                
                async for ev in pipeline_coroutine:
                    ev["engine"] = "cerebras"
                    await queue.put(ev)
            except Exception as e:
                print(f"[cerebras-pipeline] crashed: {type(e).__name__}: {e}")
                await queue.put({"type": "error", "content": str(e), "engine": "cerebras"})
            await queue.put({"type": "_cerebras_finished"})

        async def pump_gpu():
            try:
                async for ev in run_gpu_pipeline(req.image_b64, req.form_type):
                    if ev.get("type") == "gpu_pipeline_done":
                        # Translate to the frontend's existing speed_data shape.
                        model_short = (ev.get("model") or "gpu").split("/")[-1].split(":")[0].upper()
                        # Dynamic agent count text depending on pipeline
                        agents_text = "5 AGENTS" if req.form_type == "dialysis_monitoring" else "4 AGENTS"
                        await queue.put({
                            "type": "speed_data", "agent": "system",
                            "gemini_ms": ev.get("total_ms"),
                            "gemini_tps": ev.get("tps"),
                            "baseline_name": f"{agents_text} — {model_short} (GPU)",
                        })
                    elif ev.get("type") == "gpu_unavailable":
                        await queue.put({
                            "type": "speed_data", "agent": "system",
                            "gemini_ms": None, "gemini_tps": None,
                            "baseline_name": "GPU baseline — unavailable",
                            "reason": ev.get("reason"),
                        })
                    else:
                        ev["engine"] = "gpu"
                        await queue.put(ev)
            except Exception as e:
                print(f"[gpu-pipeline] crashed: {type(e).__name__}: {e}")
                await queue.put({
                    "type": "speed_data", "agent": "system",
                    "gemini_ms": None, "gemini_tps": None,
                    "baseline_name": "GPU baseline — unavailable",
                })
            await queue.put({"type": "_gpu_finished"})

        c_task = asyncio.create_task(pump_cerebras())
        g_task = asyncio.create_task(pump_gpu())

        try:
            finished = 0
            while finished < 2:
                ev = await queue.get()
                t = ev.get("type")
                if t in ("_cerebras_finished", "_gpu_finished"):
                    finished += 1
                    continue
                yield f"data: {json.dumps(ev)}\n\n"
                await asyncio.sleep(0)

            total_ms = int((time.time() - start_time) * 1000)
            yield f"data: {json.dumps({'type': 'complete', 'total_ms': total_ms, 'doc_id': doc_id})}\n\n"
        except asyncio.CancelledError:
            # Client disconnected — kill both pipelines so we don't waste API calls.
            for t in (c_task, g_task):
                if not t.done():
                    t.cancel()
            raise

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/records")
async def list_records(limit: int = 20, offset: int = 0):
    try:
        return await get_records(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/records/{record_id}")
async def get_record(record_id: str):
    try:
        return await get_record_detail(record_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
