import asyncio
from cerebras.cloud.sdk import Cerebras
import os

async def main():
    try:
        client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY", ""))
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP"}},
                    {"type": "text", "text": "What is in this image?"},
                ]
            }],
            max_tokens=10
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", type(e).__name__, str(e))

asyncio.run(main())
