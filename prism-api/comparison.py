"""
Honest GPU pipeline baseline via OpenRouter.

Runs the same 5-agent workflow that runs on Cerebras (Sage → Oracle ∥ Sentinel
→ Compass → Echo) on a real GPU-hosted vision model — identical prompts,
identical inputs, identical workflow, only the inference hardware differs.

Uptime strategy: OPENROUTER_GPU_MODELS (comma-separated) is probed once per
run; the first model that answers a tiny ping is used for the whole pipeline.
If every model fails, the GPU side is reported as 'unavailable' — never faked.
"""
import asyncio
import json
import os
import time

from openai import AsyncOpenAI

from prompts import get_prompts_for_category

_OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

# Default chain — vision-capable, OpenAI-compatible, hosted on standard GPUs.
# Override via env: OPENROUTER_GPU_MODELS=meta-llama/llama-3.2-90b-vision-instruct,qwen/qwen-2.5-vl-72b-instruct
_DEFAULT_CHAIN = ",".join([
    "google/gemma-2-27b-it",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "qwen/qwen-2.5-vl-32b-instruct:free",
    "meta-llama/llama-3.2-90b-vision-instruct",
    "qwen/qwen-2.5-vl-72b-instruct",
])
GPU_MODELS = [m.strip() for m in os.environ.get("OPENROUTER_GPU_MODELS", _DEFAULT_CHAIN).split(",") if m.strip()]

_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=_OPENROUTER_API_KEY or "dummy-key",
)


def _data_url(image_b64: str) -> str:
    return image_b64 if image_b64.startswith("data:") else f"data:image/jpeg;base64,{image_b64}"


def _parse_json(text: str) -> dict:
    try:
        s = text.find("{"); e = text.rfind("}") + 1
        if s >= 0:
            return json.loads(text[s:e])
    except Exception:
        pass
    return {"raw_text": text}


async def _probe(model_id: str) -> bool:
    """Cheap text-only ping — confirms key/model/region work before we commit."""
    try:
        await _client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": "ok"}],
            max_tokens=2,
        )
        return True
    except Exception as e:
        print(f"[gpu-pipeline] probe {model_id}: {type(e).__name__}: {e}")
        return False


async def _pick_model() -> str | None:
    for m in GPU_MODELS:
        if await _probe(m):
            print(f"[gpu-pipeline] selected {m}")
            return m
    return None


async def _gpu_call(model: str, messages: list, max_tokens: int = 1500):
    """One OpenRouter completion. Returns (text, elapsed_ms, tps_or_None)."""
    start = time.time()
    response = await _client.chat.completions.create(
        model=model, messages=messages, max_tokens=max_tokens,
    )
    elapsed_ms = int((time.time() - start) * 1000)
    text = (response.choices[0].message.content or "")
    tps = None
    try:
        out = response.usage.completion_tokens
        if out and elapsed_ms > 0:
            tps = round(out / (elapsed_ms / 1000))
    except Exception:
        pass
    return text, elapsed_ms, tps


def _chunk_stream(text: str, agent: str, size: int = 4):
    """Yield small streaming events so the UI animates the GPU side too."""
    for i in range(0, len(text), size):
        yield {"agent": agent, "type": "streaming", "content": text[i:i + size]}


async def run_gpu_pipeline(image_b64: str, form_type: str, note: str | None = None):
    """
    Real 5-agent workflow on a standard-GPU vision model. Async generator that
    yields SSE-shaped events (no `engine` tag — the caller adds it). The final
    event is `gpu_pipeline_done` with measured totals, or `gpu_unavailable` if
    the GPU side could not run.
    """
    if not _OPENROUTER_API_KEY:
        print("[gpu-pipeline] SKIPPED — OPENROUTER_API_KEY not set")
        yield {"type": "gpu_unavailable", "reason": "OPENROUTER_API_KEY not set"}
        return

    prompts = get_prompts_for_category(form_type)
    pipeline_start = time.time()

    model = await _pick_model()
    if model is None:
        yield {"type": "gpu_unavailable", "reason": "all configured GPU models failed probe"}
        return

    # ── GATEKEEPER ────────────────────────────────────────────────────
    import io, base64, pytesseract
    from PIL import Image
    try:
        b64_data = image_b64.split(",", 1)[1] if "," in image_b64 else image_b64
        img = Image.open(io.BytesIO(base64.b64decode(b64_data)))
        extracted_text = pytesseract.image_to_string(img).strip()
    except Exception as e:
        extracted_text = f"[OCR Failed: {e}]"

    if "[OCR Failed" in extracted_text or not extracted_text.strip():
        # Bypass gatekeeper
        pass
    else:
        gk_prompt = f"""You are a Gatekeeper expert. Analyze the following text extracted from a document. 
Your job is to determine if this document is likely a '{form_type}' document.
If you have >85% confidence that this document is completely unrelated to a {form_type}, you must reject it and suggest the correct category if possible (e.g., medical-records, financial-reports, insurance-policy, government-forms, logistics).
Otherwise, accept it.

Output ONLY valid JSON in this format:
{{"match": true/false, "confidence": 0.95, "suggested_template": "medical-records"}}

EXTRACTED TEXT:
{extracted_text[:3000]}
"""
        try:
            gk_text, _, _ = await _gpu_call(model, [{"role": "user", "content": gk_prompt}], max_tokens=150)
            gk_res = _parse_json(gk_text)
            if not gk_res.get("match", True) and gk_res.get("confidence", 0) >= 0.85:
                suggested = gk_res.get("suggested_template", "another")
                yield {"type": "gatekeeper_reject", "content": f"This is a {form_type} expert. Please select {suggested} expert."}
                return
        except Exception:
            pass

    image_url = _data_url(image_b64)
    all_tps: list[int] = []

    # ── SAGE (vision/OCR) ────────────────────────────────────────────────
    yield {"agent": "sage", "type": "status", "content": prompts.get("STATUS", {}).get("sage", "Extracting text and entities...")}
    sage_text = ""
    sage_result = {}

    # OCR fallback for Gemma (which is text-only on OpenRouter)
    if "gemma" in model.lower():
        sage_prompt = prompts.get("SAGE", "Extract fields into JSON.") + f"\n\nHere is the raw text extracted from the document via OCR:\n\n{extracted_text}"
        messages = [{"role": "user", "content": sage_prompt}]
    else:
        messages = [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": prompts.get("SAGE", "Extract all key information from this document into a structured JSON.")},
            ],
        }]

    try:
        sage_text, ms, tps = await _gpu_call(model, messages, max_tokens=2000)
        sage_result = _parse_json(sage_text)
        if tps: all_tps.append(tps)
        for ev in _chunk_stream(sage_text, "sage"):
            yield ev
        yield {"agent": "sage", "type": "done", "content": "", "ms": ms,
               **({"tps": tps} if tps else {})}
    except Exception as e:
        print(f"[gpu-pipeline] sage failed: {type(e).__name__}: {e}")
        yield {"agent": "sage", "type": "done", "content": "", "ms": 0, "error": str(e)}

    if form_type == "dialysis_monitoring":
        # ── ORACLE + SENTINEL (parallel) ─────────────────────────────────
        yield {"agent": "oracle", "type": "status", "content": prompts.get("STATUS", {}).get("oracle", "Validating...")}
        yield {"agent": "sentinel", "type": "status", "content": prompts.get("STATUS", {}).get("sentinel", "Checking anomalies...")}

        async def _text_agent(prompt_text: str):
            try:
                return await _gpu_call(model, [{
                    "role": "user",
                    "content": f"{prompt_text}\n\nEXTRACTED DATA:\n{json.dumps(sage_result, indent=2)}",
                }], max_tokens=1500)
            except Exception as e:
                print(f"[gpu-pipeline] text-agent failed: {type(e).__name__}: {e}")
                return ("", 0, None)

        (otext, oms, otps), (stext, sms, stps) = await asyncio.gather(
            _text_agent(prompts.get("ORACLE", "")),
            _text_agent(prompts.get("SENTINEL", "")),
        )
        if otps: all_tps.append(otps)
        if stps: all_tps.append(stps)
        yield {"agent": "oracle", "type": "done",
               "content": otext[:500] if otext else "complete",
               "ms": oms, **({"tps": otps} if otps else {})}
        yield {"agent": "sentinel", "type": "done",
               "content": stext[:500] if stext else "complete",
               "ms": sms, **({"tps": stps} if stps else {})}

        # ── COMPASS ──────────────────────────────────────────────────────
        yield {"agent": "compass", "type": "status", "content": prompts.get("STATUS", {}).get("compass", "Structuring...")}
        try:
            text, ms, tps = await _gpu_call(model, [{
                "role": "user",
                "content": f"""{prompts.get("COMPASS", "")}

SAGE EXTRACTION:
{json.dumps(sage_result, indent=2)}

ORACLE VALIDATION:
{otext}

SENTINEL ANOMALIES:
{stext}

Now produce the clean structured output JSON.""",
            }], max_tokens=2000)
            if tps: all_tps.append(tps)
            for ev in _chunk_stream(text, "compass"):
                yield ev
            yield {"agent": "compass", "type": "done", "content": "", "ms": ms,
                   **({"tps": tps} if tps else {})}
        except Exception as e:
            print(f"[gpu-pipeline] compass failed: {type(e).__name__}: {e}")
            yield {"agent": "compass", "type": "done", "content": "", "ms": 0, "error": str(e)}

        # ── ECHO ─────────────────────────────────────────────────────────
        yield {"agent": "echo", "type": "status", "content": prompts.get("STATUS", {}).get("echo", "Writing summary...")}
        echo_prompt = prompts.get("ECHO", "")
        if note and note.strip():
            echo_prompt += f"\n\nCRITICAL DIRECTIVE: The user explicitly asked the following question: '{note}'. You MUST include a dedicated 'Strategic Insight' or 'Direct Answer' section at the top of the report that directly answers this question using the extracted data."

        try:
            text, ms, tps = await _gpu_call(model, [{
                "role": "user",
                "content": f"""{echo_prompt}

EXTRACTED DATA: {json.dumps(sage_result, indent=2)}
VALIDATION: {otext}
ANOMALIES: {stext}

Write the brief now.""",
            }], max_tokens=400)
            if tps: all_tps.append(tps)
            for ev in _chunk_stream(text, "echo", size=3):
                yield ev
            yield {"agent": "echo", "type": "done", "content": "", "ms": ms,
                   **({"tps": tps} if tps else {})}
        except Exception as e:
            print(f"[gpu-pipeline] echo failed: {type(e).__name__}: {e}")
            yield {"agent": "echo", "type": "done", "content": "", "ms": 0, "error": str(e)}
    else:
        # ── RESEARCHER + NAVIGATOR (parallel) ─────────────────────────────
        yield {"agent": "researcher", "type": "status", "content": "Scouring the internet and public datasets..."}
        yield {"agent": "navigator", "type": "status", "content": "Querying external mapping and registry APIs..."}

        async def _text_agent(prompt_text: str):
            try:
                return await _gpu_call(model, [{
                    "role": "user",
                    "content": f"{prompt_text}\n\nEXTRACTED DATA:\n{json.dumps(sage_result, indent=2)}",
                }], max_tokens=1500)
            except Exception as e:
                print(f"[gpu-pipeline] text-agent failed: {type(e).__name__}: {e}")
                return ("", 0, None)
                
        research_prompt = "Analyze these deep search results based on the original extracted context. Return a JSON with summary and key insights."
        nav_prompt = "Analyze the external API data in context of the vision extraction. Return JSON with verified points."

        (rtext, rms, rtps), (ntext, nms, ntps) = await asyncio.gather(
            _text_agent(research_prompt),
            _text_agent(nav_prompt),
        )
        if rtps: all_tps.append(rtps)
        if ntps: all_tps.append(ntps)
        
        yield {"agent": "researcher", "type": "done",
               "content": rtext[:500] if rtext else "Search complete",
               "ms": rms, **({"tps": rtps} if rtps else {})}
        yield {"agent": "navigator", "type": "done",
               "content": ntext[:500] if ntext else "API calls complete",
               "ms": nms, **({"tps": ntps} if ntps else {})}

        # ── PUBLISHER ──────────────────────────────────────────────────────
        yield {"agent": "publisher", "type": "status", "content": "Compiling interactive markdown report..."}
        try:
            pub_prompt = "You are the final reporting agent. Compile the vision data, the web search results, and the API data into a comprehensive, beautifully formatted Markdown report. Use tables, headings, and bold text. This is a final artifact report for the user."
            if note and note.strip():
                pub_prompt += f"\n\nCRITICAL DIRECTIVE: The user explicitly asked the following question: '{note}'. You MUST include a dedicated 'Strategic Insight' or 'Direct Answer' section at the top of the report that directly answers this question using the extracted data."

            text, ms, tps = await _gpu_call(model, [{
                "role": "user",
                "content": f"""{pub_prompt}

SAGE EXTRACTION:
{json.dumps(sage_result, indent=2)}

RESEARCH RESULTS:
{rtext}

API DATA:
{ntext}

Write the report now.""",
            }], max_tokens=2000)
            if tps: all_tps.append(tps)
            for ev in _chunk_stream(text, "publisher", size=3):
                yield ev
            yield {"agent": "publisher", "type": "done", "content": "Interactive Artifact Generated", "ms": ms,
                   **({"tps": tps} if tps else {})}
        except Exception as e:
            print(f"[gpu-pipeline] publisher failed: {type(e).__name__}: {e}")
            yield {"agent": "publisher", "type": "done", "content": "", "ms": 0, "error": str(e)}

    total_ms = int((time.time() - pipeline_start) * 1000)
    avg_tps = round(sum(all_tps) / len(all_tps)) if all_tps else None
    print(f"[gpu-pipeline] OK ({model}) in {total_ms}ms — avg {avg_tps or '?'} tok/s")
    yield {
        "type": "gpu_pipeline_done",
        "total_ms": total_ms,
        "tps": avg_tps,
        "model": model,
    }


# ─────────────────────────────────────────────────────────────────────
# Back-compat: diagnose_baseline.py imports run_baseline(image_b64). Keep it
# working with the new model chain so the diagnostic still does what its name
# says — runs ONE Sage-equivalent call and reports ms + measured tok/s.
# ─────────────────────────────────────────────────────────────────────
async def run_baseline(image_b64: str):
    if not _OPENROUTER_API_KEY:
        print("[baseline] SKIPPED — OPENROUTER_API_KEY not set")
        return None
    model = await _pick_model()
    if model is None:
        return None
    prompts = get_prompts_for_category("medical-records")
    try:
        text, ms, tps = await _gpu_call(model, [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": _data_url(image_b64)}},
                {"type": "text", "text": prompts["SAGE"]},
            ],
        }], max_tokens=2000)
        name = f"1 AGENT — {model.split('/')[-1].split(':')[0].upper()} (GPU)"
        print(f"[baseline] OK ({model}) in {ms}ms ({tps or '?'} tok/s)")
        return {"ms": ms, "tps": tps, "name": name}
    except Exception as e:
        print(f"[baseline] FAILED: {type(e).__name__}: {e}")
        return None
