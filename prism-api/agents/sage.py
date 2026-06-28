import asyncio
import json
from prompts import SAGE_SYSTEM_PROMPT


async def run_sage(client, image_b64: str) -> dict:
    """Non-streaming Sage extraction — returns parsed dict."""
    def _call():
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                    {"type": "text", "text": SAGE_SYSTEM_PROMPT}
                ]
            }],
            max_tokens=2000,
        )
        return response.choices[0].message.content

    text = await asyncio.to_thread(_call)
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0:
            return json.loads(text[start:end])
    except Exception:
        pass
    return {"raw_text": text}
