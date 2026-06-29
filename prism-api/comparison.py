"""
Fires Gemini 2.5 Flash simultaneously for the live speed comparison.
This is NOT about getting better results — it's about demonstrating Cerebras' speed advantage.
"""
import time
import asyncio
import base64
import os

import google.generativeai as genai

_GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
genai.configure(api_key=_GOOGLE_API_KEY)

# The baseline model is configurable so you can dodge the very low free-tier
# daily cap on gemini-2.5-flash (20 req/day). Either enable billing and keep
# this default, or set GEMINI_BASELINE_MODEL to a higher-quota flash model.
BASELINE_MODEL = os.environ.get("GEMINI_BASELINE_MODEL", "gemini-2.5-flash")


async def run_gemini_baseline(image_b64: str):
    """
    Runs the same Sage extraction prompt on Gemini 2.5 Flash and measures it.

    Returns {"ms": int, "tps": int | None} on success — both the wall-clock time
    and the *measured* throughput (output tokens / wall-clock seconds, taken from
    Gemini's own usage_metadata) — or None if the call failed, so the UI can show
    "baseline unavailable" rather than a near-zero error time that would
    dishonestly make the baseline look faster than Cerebras.
    """
    from prompts import SAGE_SYSTEM_PROMPT

    if not _GOOGLE_API_KEY:
        print("[gemini-baseline] SKIPPED — GOOGLE_API_KEY is not set; baseline will show 'unavailable'.")
        return None

    start = time.time()
    try:
        model = genai.GenerativeModel(BASELINE_MODEL)
        image_bytes = base64.b64decode(image_b64)
        image_part = {"mime_type": "image/jpeg", "data": image_bytes}

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content([SAGE_SYSTEM_PROMPT, image_part])
        )
    except Exception as e:
        # Loud + typed so it's obvious in the server log whether/why Gemini failed.
        print(f"[gemini-baseline] FAILED after {int((time.time() - start) * 1000)}ms: "
              f"{type(e).__name__}: {e}")
        return None

    elapsed_ms = int((time.time() - start) * 1000)

    # Measured throughput from Gemini's own reported output token count.
    tps = None
    try:
        out_tokens = response.usage_metadata.candidates_token_count
        if out_tokens and elapsed_ms > 0:
            tps = round(out_tokens / (elapsed_ms / 1000))
    except Exception:
        pass

    print(f"[gemini-baseline] OK ({BASELINE_MODEL}) in {elapsed_ms}ms "
          f"({tps if tps is not None else '?'} tok/s measured)")
    return {"ms": elapsed_ms, "tps": tps}
