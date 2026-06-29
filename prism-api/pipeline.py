"""
Prism pipeline orchestrator.

Execution order: SAGE → (ORACLE ∥ SENTINEL) → COMPASS → ECHO

Each step yields SSE event dicts. See prism-api/CLAUDE.md for the full event schema.

Cerebras streaming note: the SDK's stream() context manager is synchronous.
We use asyncio.to_thread() to collect all chunks without blocking the event loop,
then re-yield them so the frontend receives progressive text. This approach also
lets us capture response.time_info for the required speed-metrics SSE events.
"""

import asyncio
import json
import time
import os

from cerebras.cloud.sdk import Cerebras

from agents.oracle import run_oracle
from agents.sentinel import run_sentinel
from storage import save_agent_output, save_record
from prompts import SAGE_SYSTEM_PROMPT, COMPASS_SYSTEM_PROMPT, ECHO_SYSTEM_PROMPT

client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY", ""))


async def run_prism_pipeline(image_b64: str, doc_id: str, facility_name: str):
    """Yields SSE event dicts for the full 5-agent pipeline."""

    # ── SAGE ──────────────────────────────────────────────────────────
    yield {"agent": "sage", "type": "status", "content": "Reading form structure and extracting all visible fields..."}

    sage_start = time.time()
    sage_result = None
    sage_timing = {}
    async for event in _sage_stream(image_b64):
        if isinstance(event, dict) and event.get("final"):
            sage_result = event["data"]
            sage_timing = event.get("timing", {})
        else:
            yield {"agent": "sage", "type": "streaming", "content": event}
    sage_ms = int((time.time() - sage_start) * 1000)

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
    yield {"agent": "oracle", "type": "status", "content": "Validating values against clinical reference ranges..."}
    yield {"agent": "sentinel", "type": "status", "content": "Checking for inconsistencies and anomalies..."}

    parallel_start = time.time()
    (oracle_result, oracle_timing), (sentinel_result, sentinel_timing) = await asyncio.gather(
        run_oracle(client, sage_result or {}),
        run_sentinel(client, sage_result or {}),
    )
    oracle_ms = sentinel_ms = int((time.time() - parallel_start) * 1000)

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
    yield {"agent": "compass", "type": "status", "content": "Structuring into standardized database record..."}

    compass_start = time.time()
    compass_result = None
    compass_timing = {}
    async for event in _compass_stream(sage_result, oracle_result, sentinel_result):
        if isinstance(event, dict) and event.get("final"):
            compass_result = event["data"]
            compass_timing = event.get("timing", {})
        else:
            yield {"agent": "compass", "type": "streaming", "content": event}
    compass_ms = int((time.time() - compass_start) * 1000)

    yield {"agent": "compass", "type": "done", "content": "", "ms": compass_ms, **compass_timing}
    if compass_timing:
        yield {"type": "timing", "agent": "compass", **compass_timing}
    await save_agent_output(doc_id, "compass", compass_result, compass_ms)

    # ── ECHO ──────────────────────────────────────────────────────────
    yield {"agent": "echo", "type": "status", "content": "Writing clinical intelligence brief..."}

    echo_start = time.time()
    echo_content = ""
    echo_timing = {}
    async for event in _echo_stream(sage_result, oracle_result, sentinel_result, compass_result):
        if isinstance(event, dict) and event.get("final"):
            echo_timing = event.get("timing", {})
        else:
            echo_content += event
            yield {"agent": "echo", "type": "streaming", "content": event}
    echo_ms = int((time.time() - echo_start) * 1000)

    yield {"agent": "echo", "type": "done", "content": "", "ms": echo_ms, **echo_timing}
    if echo_timing:
        yield {"type": "timing", "agent": "echo", **echo_timing}

    # ── Persist & finalize ────────────────────────────────────────────
    await save_record(
        doc_id=doc_id,
        sage=sage_result,
        oracle=oracle_result,
        sentinel=sentinel_result,
        compass=compass_result,
        echo=echo_content,
    )


# ── Streaming helpers ────────────────────────────────────────────────
# Use create() (non-streaming) so we can capture time_info, then re-yield
# chunks to simulate token-by-token streaming on the frontend.

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


async def _sage_stream(image_b64: str):
    def _call():
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                    {"type": "text", "text": SAGE_SYSTEM_PROMPT},
                ],
            }],
            max_tokens=2000,
        )
        return response

    response = await asyncio.to_thread(_call)
    text = response.choices[0].message.content

    # Simulate streaming — yield in 4-char chunks so the UI animates
    for i in range(0, len(text), 4):
        yield text[i:i + 4]

    yield {"final": True, "data": _parse_json(text), "timing": _extract_timing(response)}


async def _compass_stream(sage, oracle, sentinel):
    prompt = f"""{COMPASS_SYSTEM_PROMPT}

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

    response = await asyncio.to_thread(_call)
    text = response.choices[0].message.content

    for i in range(0, len(text), 4):
        yield text[i:i + 4]

    yield {"final": True, "data": _parse_json(text), "timing": _extract_timing(response)}


async def _echo_stream(sage, oracle, sentinel, compass):
    prompt = f"""{ECHO_SYSTEM_PROMPT}

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

    response = await asyncio.to_thread(_call)
    text = response.choices[0].message.content

    for i in range(0, len(text), 3):
        yield text[i:i + 3]

    yield {"final": True, "timing": _extract_timing(response)}
