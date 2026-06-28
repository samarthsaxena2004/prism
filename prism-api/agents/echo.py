import asyncio
import json
from prompts import ECHO_SYSTEM_PROMPT


async def run_echo(client, sage: dict, oracle: dict, sentinel: dict, compass: dict) -> str:
    """Write a concise clinical intelligence brief."""
    def _call():
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"""{ECHO_SYSTEM_PROMPT}

EXTRACTED DATA: {json.dumps(compass, indent=2) if compass else json.dumps(sage, indent=2)}
CLINICAL FLAGS: {json.dumps(oracle, indent=2) if oracle else 'None'}
ANOMALIES: {json.dumps(sentinel, indent=2) if sentinel else 'None'}

Write the intelligence brief now."""
            }],
            max_tokens=400,
        )
        return response.choices[0].message.content

    return await asyncio.to_thread(_call)
