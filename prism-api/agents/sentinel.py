import asyncio
import json
from prompts import SENTINEL_SYSTEM_PROMPT


async def run_sentinel(client, sage_result: dict) -> tuple[dict, dict]:
    """Detect anomalies and data quality issues. Returns (result_dict, timing_dict)."""
    def _call():
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"{SENTINEL_SYSTEM_PROMPT}\n\nEXTRACTED DATA:\n{json.dumps(sage_result, indent=2)}"
            }],
            max_tokens=1500,
        )
        timing = {}
        try:
            ti = response.time_info
            gen_time = ti.completion_time or 1
            timing = {
                "ttft_ms": round(ti.prompt_time * 1000),
                "tps": round(response.usage.completion_tokens / gen_time),
            }
        except Exception:
            pass
        return response.choices[0].message.content, timing

    text, timing = await asyncio.to_thread(_call)
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0:
            return json.loads(text[start:end]), timing
    except Exception:
        pass
    return {"raw_text": text, "anomaly_count": 0, "data_quality_score": 50, "anomalies": []}, timing
