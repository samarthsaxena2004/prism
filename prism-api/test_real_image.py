import asyncio
import os
import base64
from cerebras.cloud.sdk import Cerebras

async def main():
    try:
        # Use a real image if one exists, otherwise download one
        os.system("curl -s -o test.jpg https://raw.githubusercontent.com/cerebras/cerebras-cloud-sdk-python/main/tests/test_image.jpg || curl -s -o test.jpg https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/128px-React-icon.svg.png")
        with open("test.jpg", "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
            
        client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY", ""))
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": "What is in this image? Reply in one word."},
                ]
            }],
            max_tokens=10
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", type(e).__name__, str(e))

asyncio.run(main())
