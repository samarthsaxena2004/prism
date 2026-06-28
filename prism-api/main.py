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
    form_type: str = "dialysis_monitoring"


@app.get("/health")
async def health():
    return {"status": "ok", "model": "gemma-4-31b", "provider": "cerebras"}


@app.post("/api/upload")
async def upload_form(file: UploadFile = File(...)):
    """Accept a form image, return base64 for the analyze endpoint."""
    content = await file.read()
    b64 = base64.b64encode(content).decode()
    return {"image_b64": b64, "filename": file.filename, "size": len(content)}


@app.post("/api/analyze")
async def analyze_document(req: AnalyzeRequest):
    """
    Main endpoint — runs the 5-agent pipeline and streams SSE events.
    See prism-api/CLAUDE.md for the full SSE event schema.
    """
    doc_id = str(uuid.uuid4())

    # Persist the document row before streaming starts
    try:
        await save_document(doc_id, req.facility_name, req.form_type)
    except Exception as e:
        print(f"Warning: could not create document row: {e}")

    async def event_stream():
        start_time = time.time()
        try:
            async for event in run_prism_pipeline(
                image_b64=req.image_b64,
                doc_id=doc_id,
                facility_name=req.facility_name,
            ):
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        finally:
            total_ms = int((time.time() - start_time) * 1000)
            yield f"data: {json.dumps({'type': 'complete', 'total_ms': total_ms, 'doc_id': doc_id})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/records")
async def list_records(limit: int = 20, offset: int = 0):
    """Browse paginated digitized records."""
    try:
        return await get_records(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/records/{record_id}")
async def get_record(record_id: str):
    """Fetch a single record with all agent outputs."""
    try:
        return await get_record_detail(record_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
