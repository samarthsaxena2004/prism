"""
Standalone check that the Gemini speed-comparison baseline actually works.

Run locally from prism-api/ (with your keys in prism-api/.env):

    python diagnose_gemini.py            # uses a tiny generated test image
    python diagnose_gemini.py form.jpg   # uses one of your own form images

It exercises the EXACT same code path as the live app
(comparison.run_gemini_baseline) and prints whether Gemini responded, how long
it took, and its measured tokens/sec — so you can confirm the baseline is real
rather than silently failing (which is what makes the GPU timer never settle).
"""
import asyncio
import base64
import io
import os
import sys

from dotenv import load_dotenv

load_dotenv()


def _make_test_image_b64() -> str:
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (480, 200), "white")
    draw = ImageDraw.Draw(img)
    draw.text((20, 80), "PRISM diagnostic form", fill="black")
    draw.text((20, 110), "Patient: DEMO-0001   BP: 150/90   Wt: 62kg", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode()


async def main() -> None:
    key = os.environ.get("GOOGLE_API_KEY", "")
    print(f"GOOGLE_API_KEY: {'set (' + str(len(key)) + ' chars)' if key else 'MISSING'}")
    if not key:
        print("→ Set GOOGLE_API_KEY in prism-api/.env, then re-run.")
        return

    if len(sys.argv) > 1:
        with open(sys.argv[1], "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode()
        print(f"Using image: {sys.argv[1]}")
    else:
        image_b64 = _make_test_image_b64()
        print("Using generated test image")

    from comparison import run_gemini_baseline

    print("Calling Gemini 2.5 Flash (same path as the live app)...")
    result = await run_gemini_baseline(image_b64)

    if result is None:
        print("RESULT: ❌ baseline FAILED — see the [gemini-baseline] line above for the reason.")
        print("        Common causes: invalid/region-locked GOOGLE_API_KEY, model name not")
        print("        enabled for your key, or no network egress to generativelanguage.googleapis.com")
    else:
        print(f"RESULT: ✅ Gemini responded in {result['ms']}ms "
              f"({result['tps'] if result['tps'] is not None else '?'} tok/s measured)")


if __name__ == "__main__":
    asyncio.run(main())
