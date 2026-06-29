"""
Fires an OpenRouter baseline simultaneously for the live speed comparison.
Attempts Gemma 4 31B first for an apples-to-apples hardware comparison.
If it hits a rate limit, falls back to Llama 3.2 Vision.
"""
import time
import asyncio
import os

from openai import AsyncOpenAI

_OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

PRIMARY_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
PRIMARY_NAME = "1 AGENT — NEMOTRON OMNI (GPU)"

FALLBACK_MODEL = "google/gemma-4-31b-it:free"
FALLBACK_NAME = "1 AGENT — GEMMA 4 (GPU)"

# Initialize the OpenAI client pointing to OpenRouter
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=_OPENROUTER_API_KEY or "dummy-key-to-allow-init"
)

async def _call_openrouter(model_id: str, image_b64: str, include_image: bool = True):
    from prompts import SAGE_SYSTEM_PROMPT
    content = [{"type": "text", "text": SAGE_SYSTEM_PROMPT}]
    if include_image:
        url = image_b64 if image_b64.startswith("data:") else f"data:image/jpeg;base64,{image_b64}"
        content.append({
            "type": "image_url",
            "image_url": {
                "url": url
            }
        })

    return await client.chat.completions.create(
        model=model_id,
        messages=[{"role": "user", "content": content}]
    )

async def run_baseline(image_b64: str):
    """
    Runs the same Sage extraction prompt on a standard GPU vision model and measures it.

    Returns {"ms": int, "tps": int | None, "name": str} on success — both the wall-clock time
    and the *measured* throughput (output tokens / wall-clock seconds, taken from
    OpenRouter's usage_metadata) — or None if the call failed.
    """
    if not _OPENROUTER_API_KEY:
        print("[baseline] SKIPPED — OPENROUTER_API_KEY is not set; baseline will show 'unavailable'.")
        return None

    start = time.time()
    
    try:
        response = await _call_openrouter(PRIMARY_MODEL, image_b64)
        active_name = PRIMARY_NAME
        active_model = PRIMARY_MODEL
    except Exception as e:
        print(f"[baseline] PRIMARY ({PRIMARY_MODEL}) FAILED: {type(e).__name__}: {e}")
        print(f"[baseline] Automatically falling back to {FALLBACK_MODEL}...")
        try:
            # Fallback model attempt (Omni supports vision)
            response = await _call_openrouter(FALLBACK_MODEL, image_b64)
            active_name = FALLBACK_NAME
            active_model = FALLBACK_MODEL
        except Exception as fallback_e:
            print(f"[baseline] FALLBACK FAILED after {int((time.time() - start) * 1000)}ms: "
                  f"{type(fallback_e).__name__}: {fallback_e}")
            return None

    elapsed_ms = int((time.time() - start) * 1000)

    # Measured throughput from OpenAI usage metadata
    tps = None
    try:
        if response.usage and hasattr(response.usage, 'completion_tokens'):
            out_tokens = response.usage.completion_tokens
            if out_tokens and elapsed_ms > 0:
                tps = round(out_tokens / (elapsed_ms / 1000))
    except Exception:
        pass

    print(f"[baseline] OK ({active_model}) in {elapsed_ms}ms "
          f"({tps if tps is not None else '?'} tok/s measured)")
    return {"ms": elapsed_ms, "tps": tps, "name": active_name}
