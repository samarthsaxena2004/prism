import asyncio
import json
from prompts import COMPASS_SYSTEM_PROMPT


async def run_compass(client, sage: dict, oracle: dict, sentinel: dict) -> dict:
    """Structure validated data into a standardized database record."""
    def _call():
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"""{COMPASS_SYSTEM_PROMPT}

SAGE EXTRACTION:
{json.dumps(sage, indent=2) if sage else 'No data'}

ORACLE VALIDATION:
{json.dumps(oracle, indent=2) if oracle else 'No data'}

SENTINEL ANOMALIES:
{json.dumps(sentinel, indent=2) if sentinel else 'No data'}

Now produce the clean structured output JSON."""
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
