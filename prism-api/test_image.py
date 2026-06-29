import asyncio
import os
import base64
from cerebras.cloud.sdk import Cerebras

async def main():
    try:
        # Create a tiny valid 1x1 white JPEG image
        b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
        client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY", ""))
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": "What is the color of this image? Reply in one word."},
                ]
            }],
            max_tokens=10
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", type(e).__name__, str(e))

asyncio.run(main())
