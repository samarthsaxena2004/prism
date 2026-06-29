import asyncio
import os
import json
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

load_dotenv("prism-api/.env")

client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY", ""))

async def test():
    print("Testing Cerebras API...")
    try:
        response = client.chat.completions.create(
            model="llama3.1-8b", # Just testing connection first
            messages=[{"role": "user", "content": "Hello"}]
        )
        print("llama-3.1-8b success:", response.choices[0].message.content)
    except Exception as e:
        print("llama-3.1-8b failed:", str(e))

    print("\nTesting gemma-4-31b with image...")
    try:
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="}},
                    {"type": "text", "text": "What is this?"},
                ],
            }],
        )
        print("gemma-4-31b success:", response.choices[0].message.content)
    except Exception as e:
        print("gemma-4-31b failed:", str(e))

asyncio.run(test())
