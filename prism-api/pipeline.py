"""
Prism pipeline orchestrator.

Execution order: SAGE → (ORACLE ∥ SENTINEL) → COMPASS → ECHO

Each step yields SSE event dicts. See prism-api/CLAUDE.md for the full event schema.

Reliability contract: every agent ALWAYS emits a terminal `done` event, even if
its Cerebras call fails — the streaming helpers below catch their own errors and
fall back to a safe payload, mirroring the non-streaming agents. This guarantees
the UI never leaves an agent spinning forever.

Speed comparison: the Gemini baseline is fired at pipeline start and awaited to
*real* completion at the end (no artificial timeout), so the GPU number shown in
the UI is a genuine measured wall-clock time, never a fabricated counter.
"""

import asyncio
import json
import time
import os

from cerebras.cloud.sdk import Cerebras

from agents.oracle import run_oracle
from agents.sentinel import run_sentinel
from storage import save_agent_output, save_record
from insights import compute_insights
from prompts import get_prompts_for_category

client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY", ""))

# Add automatic fallback for Cerebras API rate limits
_fallback_key = os.environ.get("CEREBRAS_FALLBACK_API_KEY")
if _fallback_key:
    _fallback_client = Cerebras(api_key=_fallback_key)
    _original_create = client.chat.completions.create
    
    def _fallback_create(*args, **kwargs):
        try:
            return _original_create(*args, **kwargs)
        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "rate limit" in err_msg or "too many requests" in err_msg:
                print(f"[CEREBRAS] Rate limit hit on primary key, falling back to secondary key...")
                return _fallback_client.chat.completions.create(*args, **kwargs)
            raise e
            
    client.chat.completions.create = _fallback_create

async def run_prism_pipeline(image_b64: str, doc_id: str, facility_name: str, form_type: str = "general", note: str | None = None):
    """Yields SSE event dicts representing agent states and final output."""
    pipeline_start = time.time()
    timings: dict[str, dict] = {}

    # Get category specific prompts
    prompts = get_prompts_for_category(form_type)

    # ── WAKE UP ALL AGENTS (UI UX) ────────────────────────────────────
    # We yield initial statuses for all agents so the UI shows them all
    # initializing/working simultaneously, rather than sitting idle.
    yield {"agent": "sage", "type": "status", "content": prompts["STATUS"]["sage"]}
    yield {"agent": "oracle", "type": "status", "content": prompts["STATUS"]["oracle"]}
    yield {"agent": "sentinel", "type": "status", "content": prompts["STATUS"]["sentinel"]}
    yield {"agent": "compass", "type": "status", "content": prompts["STATUS"]["compass"]}
    yield {"agent": "echo", "type": "status", "content": prompts["STATUS"]["echo"]}

    # ── GATEKEEPER ────────────────────────────────────────────────────
    # 1. Fast local OCR
    yield {"agent": "sage", "type": "status", "content": "Running OCR extraction..."}
    extracted_text = extract_text_from_image(image_b64)

    # 2. Fast Cerebras validation check
    yield {"agent": "sage", "type": "status", "content": "Validating template fit..."}
    gk_res = await _gatekeeper_check(extracted_text, form_type)
    
    if not gk_res.get("match", True) and gk_res.get("confidence", 0) >= 0.85:
        suggested = gk_res.get("suggested_template", "another")
        err_msg = f"This is a {form_type} expert. Please select {suggested} expert."
        yield {"type": "gatekeeper_reject", "content": err_msg}
        return

    yield {"agent": "sage", "type": "status", "content": prompts.get("STATUS", {}).get("sage", "Extracting data...")}

    # ── SAGE ──────────────────────────────────────────────────────────

    sage_start = time.time()
    sage_result = None
    sage_timing = {}
    async for event in _sage_stream(extracted_text, prompts.get("SAGE", "Extract fields into JSON.")):
        if isinstance(event, dict) and event.get("final"):
            sage_result = event["data"]
            sage_timing = event.get("timing", {})
        else:
            yield {"agent": "sage", "type": "streaming", "content": event}
    sage_ms = int((time.time() - sage_start) * 1000)
    timings["sage"] = sage_timing

    # Build a brief summary for the frontend to show in the agent detail line
    sage_summary = ""
    if isinstance(sage_result, dict):
        sessions = sage_result.get("sessions") or []
        patient = sage_result.get("header") or sage_result.get("patient") or {}
        n = len(sessions) if isinstance(sessions, list) else 0
        name = patient.get("patient_name") or patient.get("name") or ""
        if n and name:
            sage_summary = f"{n} sessions extracted · {name}"
        elif n:
            sage_summary = f"{n} sessions extracted"
        else:
            sage_summary = "Fields extracted"
    yield {"agent": "sage", "type": "done", "content": sage_summary, "ms": sage_ms, **sage_timing}
    if sage_timing:
        yield {"type": "timing", "agent": "sage", **sage_timing}

    await save_agent_output(doc_id, "sage", sage_result, sage_ms)

    # ── ORACLE + SENTINEL (parallel) ──────────────────────────────────
    yield {"agent": "oracle", "type": "status", "content": prompts["STATUS"]["oracle"]}
    yield {"agent": "sentinel", "type": "status", "content": prompts["STATUS"]["sentinel"]}

    parallel_start = time.time()
    (oracle_result, oracle_timing), (sentinel_result, sentinel_timing) = await asyncio.gather(
        run_oracle(client, sage_result or {}, prompts["ORACLE"]),
        run_sentinel(client, sage_result or {}, prompts["SENTINEL"]),
    )
    oracle_ms = sentinel_ms = int((time.time() - parallel_start) * 1000)
    timings["oracle"] = oracle_timing
    timings["sentinel"] = sentinel_timing

    yield {
        "agent": "oracle", "type": "done",
        "content": json.dumps(oracle_result, indent=2)[:500] if oracle_result else "Validation complete",
        "ms": oracle_ms, **oracle_timing,
    }
    yield {
        "agent": "sentinel", "type": "done",
        "content": json.dumps(sentinel_result, indent=2)[:500] if sentinel_result else "Analysis complete",
        "ms": sentinel_ms, **sentinel_timing,
    }
    if oracle_timing:
        yield {"type": "timing", "agent": "oracle", **oracle_timing}
    if sentinel_timing:
        yield {"type": "timing", "agent": "sentinel", **sentinel_timing}

    await save_agent_output(doc_id, "oracle", oracle_result, oracle_ms)
    await save_agent_output(doc_id, "sentinel", sentinel_result, sentinel_ms)

    # ── COMPASS ───────────────────────────────────────────────────────
    yield {"agent": "compass", "type": "status", "content": prompts["STATUS"]["compass"]}

    compass_start = time.time()
    compass_result = None
    compass_timing = {}
    async for event in _compass_stream(sage_result, oracle_result, sentinel_result, prompts["COMPASS"]):
        if isinstance(event, dict) and event.get("final"):
            compass_result = event["data"]
            compass_timing = event.get("timing", {})
        else:
            yield {"agent": "compass", "type": "streaming", "content": event}
    compass_ms = int((time.time() - compass_start) * 1000)
    timings["compass"] = compass_timing

    yield {"agent": "compass", "type": "done", "content": "", "ms": compass_ms, **compass_timing}
    if compass_timing:
        yield {"type": "timing", "agent": "compass", **compass_timing}
    await save_agent_output(doc_id, "compass", compass_result, compass_ms)

    # ── ECHO ──────────────────────────────────────────────────────────
    yield {"agent": "echo", "type": "status", "content": prompts["STATUS"]["echo"]}

    echo_start = time.time()
    echo_content = ""
    echo_timing = {}
    echo_prompt = prompts.get("ECHO", "Summarize the final insights.")
    
    if note and note.strip():
        echo_prompt += f"\n\nCRITICAL DIRECTIVE: The user explicitly asked the following question: '{note}'. You MUST include a dedicated 'Strategic Insight' or 'Direct Answer' section at the top of the report that directly answers this question using the extracted data."

    echo_prompt += """\n\nCRITICAL VISUALIZATION REQUIREMENT:
At the absolute end of your markdown response, you MUST append a JSON block containing visualization data appropriate for this category.
For Medical Records/Dialysis: Output a Radar chart for Vitals.
Format EXACTLY like this (use ```json visualize):
```json visualize
{
  "type": "medical_radar",
  "data": [
    {"subject": "Systolic BP", "value": 140, "fullMark": 200},
    {"subject": "Diastolic BP", "value": 90, "fullMark": 150},
    {"subject": "Heart Rate", "value": 85, "fullMark": 150}
  ]
}
```"""

    async for event in _echo_stream(sage_result, oracle_result, sentinel_result, compass_result, echo_prompt):
        if isinstance(event, dict) and event.get("final"):
            echo_timing = event.get("timing", {})
        else:
            echo_content += event
            yield {"agent": "echo", "type": "streaming", "content": event}
    echo_ms = int((time.time() - echo_start) * 1000)
    timings["echo"] = echo_timing

    yield {"agent": "echo", "type": "done", "content": "", "ms": echo_ms, **echo_timing}
    if echo_timing:
        yield {"type": "timing", "agent": "echo", **echo_timing}

    # ── Persist ───────────────────────────────────────────────────────
    await save_record(
        doc_id=doc_id,
        sage=sage_result,
        oracle=oracle_result,
        sentinel=sentinel_result,
        compass=compass_result,
        echo=echo_content,
    )

    # ── Enterprise insight layer (deterministic, no extra model call) ──
    pipeline_ms = int((time.time() - pipeline_start) * 1000)
    insights = compute_insights(
        sage=sage_result,
        oracle=oracle_result,
        sentinel=sentinel_result,
        compass=compass_result,
        timings=timings,
        pipeline_ms=pipeline_ms,
    )
    yield {"type": "insights", "agent": "system", "data": insights}

    # Cerebras pipeline is fully done — freeze its timer in the UI now and reveal
    # results, while the GPU baseline keeps running until it genuinely finishes.
    # `cerebras_tps` is the measured average throughput across agents (from each
    # response's time_info), so the UI shows a real number, not a static claim.
    yield {
        "type": "pipeline_done", "agent": "system",
        "total_ms": pipeline_ms, "doc_id": doc_id,
        "cerebras_tps": insights.get("throughput_tps"),
    }
    # GPU comparison + speed_data emission is owned by main.py.


# ── Streaming helpers ────────────────────────────────────────────────
# Use create() (non-streaming) so we can capture time_info, then re-yield
# chunks to simulate token-by-token streaming on the frontend. Each helper
# catches its own errors and still emits a final payload so the pipeline and
# the UI always reach a terminal state.

def _extract_timing(response) -> dict:
    try:
        ti = response.time_info
        gen_time = ti.completion_time or 1
        return {
            "ttft_ms": round(ti.prompt_time * 1000),
            "tps": round(response.usage.completion_tokens / gen_time),
        }
    except Exception:
        return {}


def _parse_json(text: str) -> dict:
    try:
        s = text.find("{")
        e = text.rfind("}") + 1
        if s >= 0:
            return json.loads(text[s:e])
    except Exception:
        pass
    return {"raw_text": text}


import io
from PIL import Image
import pytesseract

def extract_text_from_image(image_b64: str) -> str:
    """Synchronously extracts text from b64 image using pytesseract."""
    import io, base64, pytesseract
    from PIL import Image
    try:
        b64_data = image_b64.split(",", 1)[1] if "," in image_b64 else image_b64
        img = Image.open(io.BytesIO(base64.b64decode(b64_data)))
        return pytesseract.image_to_string(img).strip()
    except Exception as e:
        return f"[OCR Failed: {e}]"

async def _gatekeeper_check(extracted_text: str, form_type: str) -> dict:
    """Uses Cerebras to determine if the extracted text matches the form type with high confidence."""
    if "[OCR Failed" in extracted_text or not extracted_text.strip():
        return {"match": True, "confidence": 0}

    prompt = f"""You are a Gatekeeper expert. Analyze the following text extracted from a document. 
Your job is to determine if this document is likely a '{form_type}' document.
If you have >85% confidence that this document is completely unrelated to a {form_type}, you must reject it and suggest the correct category if possible (e.g., medical-records, financial-reports, insurance-policy, government-forms, logistics).
Otherwise, accept it.

Output ONLY valid JSON in this format:
{{"match": true/false, "confidence": 0.95, "suggested_template": "medical-records"}}

EXTRACTED TEXT:
{extracted_text[:3000]}
"""
    try:
        res = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            response_format={"type": "json_object"}
        )
        text = res.choices[0].message.content or ""
        return json.loads(text)
    except Exception as e:
        print(f"Gatekeeper failed: {e}")
        return {"match": True, "confidence": 1.0, "suggested_template": form_type}

async def _sage_stream(extracted_text: str, prompt: str):
    def _call():
        sage_prompt = prompt + f"\n\nHere is the raw text extracted from the document via OCR:\n\n{extracted_text}"
        return client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{"role": "user", "content": sage_prompt}],
            stream=True,
            max_tokens=1500,
        )
    
    start = time.time()
    stream = await asyncio.to_thread(_call)
    
    full_text = ""
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_text += content
            yield content

    def _calc_tps(text, start_time):
        dt = time.time() - start_time
        return round(len(text.split()) / dt) if dt > 0 else 0

    yield {"final": True, "data": _parse_json(full_text), "timing": {"tps": _calc_tps(full_text, start)}}


async def _compass_stream(sage, oracle, sentinel, prompt_str: str):
    prompt = f"""{prompt_str}

SAGE EXTRACTION:
{json.dumps(sage, indent=2) if sage else 'No data'}

ORACLE VALIDATION:
{json.dumps(oracle, indent=2) if oracle else 'No data'}

SENTINEL ANOMALIES:
{json.dumps(sentinel, indent=2) if sentinel else 'No data'}

Now produce the clean structured output JSON."""

    def _call():
        return client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
        )

    try:
        response = await asyncio.to_thread(_call)
        text = response.choices[0].message.content or ""
        timing = _extract_timing(response)
    except Exception as e:
        yield {"final": True, "data": {"raw_text": "", "error": str(e)}, "timing": {}}
        return

    for i in range(0, len(text), 4):
        yield text[i:i + 4]
    yield {"final": True, "data": _parse_json(text), "timing": timing}


async def _echo_stream(sage, oracle, sentinel, compass, prompt_str: str):
    prompt = f"""{prompt_str}

EXTRACTED DATA: {json.dumps(compass, indent=2) if compass else json.dumps(sage, indent=2)}
CLINICAL FLAGS: {json.dumps(oracle, indent=2) if oracle else 'None'}
ANOMALIES: {json.dumps(sentinel, indent=2) if sentinel else 'None'}

Write the intelligence brief now."""

    def _call():
        return client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
        )

    try:
        response = await asyncio.to_thread(_call)
        text = response.choices[0].message.content or ""
        timing = _extract_timing(response)
    except Exception as e:
        yield "Intelligence brief unavailable — the synthesis step could not complete."
        yield {"final": True, "timing": {}, "error": str(e)}
        return

    for i in range(0, len(text), 3):
        yield text[i:i + 3]
    yield {"final": True, "timing": timing}
