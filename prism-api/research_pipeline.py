import asyncio
import json
import time

from pipeline import _sage_stream, client, extract_text_from_image, _gatekeeper_check
from storage import save_agent_output

from agents.researcher import run_researcher
from agents.navigator import run_navigator
from agents.publisher import _publisher_stream
from prompts import get_prompts_for_category


async def run_research_pipeline(image_b64: str, doc_id: str, facility_name: str, form_type: str = "general", note: str | None = None):
    """Yields SSE event dicts for the Deep Research 4-agent pipeline."""
    
    pipeline_start = time.time()
    timings: dict[str, dict] = {}
    
    prompts = get_prompts_for_category(form_type)
    
    # ── WAKE UP ALL AGENTS (UI UX) ────────────────────────────────────
    yield {"agent": "sage", "type": "status", "content": "Extracting text and entities from image..."}
    yield {"agent": "researcher", "type": "status", "content": "Awaiting entities for deep web search..."}
    yield {"agent": "navigator", "type": "status", "content": "Awaiting entities for API enrichment..."}
    yield {"agent": "publisher", "type": "status", "content": "Awaiting context to compile artifact..."}

    # ── GATEKEEPER ────────────────────────────────────────────────────
    extracted_text = extract_text_from_image(image_b64)
    gk_res = await _gatekeeper_check(extracted_text, form_type)
    
    if not gk_res.get("match", True) and gk_res.get("confidence", 0) >= 0.85:
        suggested = gk_res.get("suggested_template", "another")
        err_msg = f"This is a {form_type} expert. Please select {suggested} expert."
        yield {"type": "gatekeeper_reject", "content": err_msg}
        return

    # ── SAGE (Vision Extractor) ───────────────────────────────────────
    sage_start = time.time()
    sage_result = None
    sage_timing = {}
    async for event in _sage_stream(extracted_text, prompts.get("SAGE", "Extract all key information from this document into a structured JSON.")):
        if isinstance(event, dict) and event.get("final"):
            sage_result = event["data"]
            sage_timing = event.get("timing", {})
        else:
            yield {"agent": "sage", "type": "streaming", "content": event}
            
    sage_ms = int((time.time() - sage_start) * 1000)
    timings["sage"] = sage_timing
    
    sage_summary = "Fields extracted"
    if isinstance(sage_result, dict):
        sage_summary = f"{len(sage_result.keys())} primary entities extracted"
        
    yield {"agent": "sage", "type": "done", "content": sage_summary, "ms": sage_ms, **sage_timing}
    if sage_timing:
        yield {"type": "timing", "agent": "sage", **sage_timing}
        
    await save_agent_output(doc_id, "sage", sage_result, sage_ms)

    # ── RESEARCHER + NAVIGATOR (parallel) ─────────────────────────────
    yield {"agent": "researcher", "type": "status", "content": "Scouring the internet and public datasets..."}
    yield {"agent": "navigator", "type": "status", "content": "Querying external mapping and registry APIs..."}

    parallel_start = time.time()
    research_prompt = "Analyze these deep search results based on the original extracted context. Return a JSON with summary and key insights."
    nav_prompt = "Analyze the external API data in context of the vision extraction. Return JSON with verified points."
    
    (researcher_result, researcher_timing), (navigator_result, navigator_timing) = await asyncio.gather(
        run_researcher(client, sage_result or {}, research_prompt, note),
        run_navigator(client, sage_result or {}, nav_prompt),
    )
    
    parallel_ms = int((time.time() - parallel_start) * 1000)
    
    yield {
        "agent": "researcher", "type": "done",
        "content": json.dumps(researcher_result, indent=2)[:500] if researcher_result else "Search complete",
        "ms": parallel_ms, **researcher_timing,
    }
    yield {
        "agent": "navigator", "type": "done",
        "content": json.dumps(navigator_result, indent=2)[:500] if navigator_result else "API calls complete",
        "ms": parallel_ms, **navigator_timing,
    }

    await save_agent_output(doc_id, "researcher", researcher_result, parallel_ms)
    await save_agent_output(doc_id, "navigator", navigator_result, parallel_ms)


    # ── PUBLISHER (Artifact Generator) ────────────────────────────────
    yield {"agent": "publisher", "type": "status", "content": "Compiling interactive markdown report..."}

    pub_start = time.time()
    pub_result = None
    pub_timing = {}
    
    pub_prompt = """You are the final reporting agent. Compile the vision data, the web search results, and the API data into a comprehensive, beautifully formatted Markdown report. Use tables, headings, and bold text. This is a final artifact report for the user.

CRITICAL VISUALIZATION REQUIREMENT:
At the absolute end of your markdown response, you MUST append a JSON block containing visualization data appropriate for this category.
For Financial Reports: Output an Area Chart for Revenue/Expenses.
For Logistics: Output an Interactive Map with coordinates.
For Insurance: Output a Gauge Chart for approval probability.
For Government: Output a Stepper for approval workflow.
Format EXACTLY like this (use ```json visualize):
```json visualize
{
  "type": "financial_area",
  "data": [
    {"name": "2024", "revenue": 4000, "expenses": 2400},
    {"name": "2025", "revenue": 3000, "expenses": 1398}
  ]
}
```"""
    
    async for event in _publisher_stream(sage_result, researcher_result, navigator_result, pub_prompt, note):
        if isinstance(event, dict) and event.get("final"):
            pub_result = event["data"]
            pub_timing = event.get("timing", {})
        else:
            yield {"agent": "publisher", "type": "streaming", "content": event}
            
    pub_ms = int((time.time() - pub_start) * 1000)
    
    yield {"agent": "publisher", "type": "done", "content": "Interactive Artifact Generated", "ms": pub_ms, **pub_timing}
    await save_agent_output(doc_id, "publisher", {"markdown": pub_result}, pub_ms)
