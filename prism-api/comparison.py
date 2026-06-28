"""
Fires Gemini 2.5 Flash simultaneously for the live speed comparison.
This is NOT about getting better results — it's about demonstrating Cerebras' speed advantage.
"""
import time
import asyncio
import base64
import os

import google.generativeai as genai

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY", ""))


async def run_gemini_baseline(image_b64: str) -> int:
    """
    Runs the same Sage extraction prompt on Gemini 2.5 Flash.
    Returns elapsed milliseconds.
    """
    from prompts import SAGE_SYSTEM_PROMPT

    start = time.time()
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        image_bytes = base64.b64decode(image_b64)
        image_part = {"mime_type": "image/jpeg", "data": image_bytes}

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: model.generate_content([SAGE_SYSTEM_PROMPT, image_part])
        )
    except Exception as e:
        print(f"Gemini baseline failed: {e}")

    return int((time.time() - start) * 1000)
