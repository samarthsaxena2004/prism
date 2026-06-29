"""
Standalone check that the OpenRouter speed-comparison baseline actually works.

IMPORTANT: run it with the interpreter that has your deps (miniconda), from
prism-api/:

    /opt/miniconda3/bin/python3 diagnose_baseline.py
    /opt/miniconda3/bin/python3 diagnose_baseline.py /Users/samarthsaxena/Documents/dialysis/1.png

Step 1 (always) does a tiny text-only call to confirm your key/model/network.
Step 2 (only if you pass an image path) runs the EXACT baseline code path the
live app uses and prints the measured wall-clock ms + tokens/sec.
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv

load_dotenv()


async def _probe_text() -> bool:
    """Text-only connectivity / key / model check — no image."""
    from openai import AsyncOpenAI
    
    key = os.environ.get("OPENROUTER_API_KEY", "")
    model_name = os.environ.get("BASELINE_MODEL", "google/gemma-4-31b-it:free")
    
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=key or "dummy-key"
    )
    
    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Reply with exactly: OK"}]
        )
        print(f"Step 1 — text probe ({model_name}): ✅ OpenRouter replied: {(response.choices[0].message.content or '').strip()!r}")
        return True
    except Exception as e:
        print(f"Step 1 — text probe: ❌ {type(e).__name__}: {e}")
        return False


async def main() -> None:
    key = os.environ.get("OPENROUTER_API_KEY", "")
    print(f"OPENROUTER_API_KEY: {'set (' + str(len(key)) + ' chars)' if key else 'MISSING'}")
    if not key:
        print("→ Set OPENROUTER_API_KEY in prism-api/.env, then re-run.")
        return

    ok = await _probe_text()

    # Step 2 only runs if an image path is supplied.
    if len(sys.argv) <= 1:
        if ok:
            print("\nText path works. To test the real image baseline too, pass a form image:")
            print("    /opt/miniconda3/bin/python3 diagnose_baseline.py /Users/samarthsaxena/Documents/dialysis/1.png")
        else:
            print("\nThe text probe failed — fix that first; it uses the same key/model the")
            print("image baseline does. Common causes: invalid key or network issue.")
        return

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"\nStep 2 — image path: ❌ file not found: {path}")
        return

    with open(path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()
    print(f"\nStep 2 — image baseline on {path} (same path as the live app)...")

    from comparison import run_baseline

    result = await run_baseline(image_b64)
    if result is None:
        print("Step 2 — image baseline: ❌ FAILED — see the [baseline] line above for why.")
    else:
        print(f"Step 2 — image baseline: ✅ {result['ms']}ms "
              f"({result['tps'] if result['tps'] is not None else '?'} tok/s measured)")


if __name__ == "__main__":
    asyncio.run(main())
