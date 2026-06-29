"""
Standalone check that the Gemini speed-comparison baseline actually works.

IMPORTANT: run it with the interpreter that has your deps (miniconda), from
prism-api/:

    /opt/miniconda3/bin/python3 diagnose_gemini.py
    /opt/miniconda3/bin/python3 diagnose_gemini.py /Users/you/Documents/dialysis/1.png

Plain `python` on macOS is usually Homebrew Python, which does NOT have
google-generativeai installed — see prism-api/CLAUDE.md.

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


def _probe_text() -> bool:
    """Text-only connectivity / key / model check — no image, no Pillow needed."""
    import google.generativeai as genai

    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY", ""))
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = model.generate_content("Reply with exactly: OK")
        print(f"Step 1 — text probe: ✅ Gemini replied: {(resp.text or '').strip()!r}")
        return True
    except Exception as e:
        print(f"Step 1 — text probe: ❌ {type(e).__name__}: {e}")
        return False


async def main() -> None:
    key = os.environ.get("GOOGLE_API_KEY", "")
    print(f"GOOGLE_API_KEY: {'set (' + str(len(key)) + ' chars)' if key else 'MISSING'}")
    if not key:
        print("→ Set GOOGLE_API_KEY in prism-api/.env, then re-run.")
        return

    ok = _probe_text()

    # Step 2 only runs if an image path is supplied.
    if len(sys.argv) <= 1:
        if ok:
            print("\nText path works. To test the real image baseline too, pass a form image:")
            print("    /opt/miniconda3/bin/python3 diagnose_gemini.py /path/to/form.jpg")
        else:
            print("\nThe text probe failed — fix that first; it uses the same key/model the")
            print("image baseline does. Common causes: invalid/region-locked key,")
            print("gemini-2.5-flash not enabled for your key, or no network egress to")
            print("generativelanguage.googleapis.com")
        return

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"\nStep 2 — image path: ❌ file not found: {path}")
        print("Tip: your real forms live at /Users/samarthsaxena/Documents/dialysis/1.png")
        return

    with open(path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()
    print(f"\nStep 2 — image baseline on {path} (same path as the live app)...")

    from comparison import run_gemini_baseline

    result = await run_gemini_baseline(image_b64)
    if result is None:
        print("Step 2 — image baseline: ❌ FAILED — see the [gemini-baseline] line above for why.")
    else:
        print(f"Step 2 — image baseline: ✅ {result['ms']}ms "
              f"({result['tps'] if result['tps'] is not None else '?'} tok/s measured)")


if __name__ == "__main__":
    asyncio.run(main())
