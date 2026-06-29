import asyncio
import json


async def run_oracle(client, sage_result: dict, prompt: str) -> tuple[dict, dict]:
    """Validate clinical values. Returns (result_dict, timing_dict)."""
    def _call():
        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"{prompt}\n\nEXTRACTED DATA:\n{json.dumps(sage_result, indent=2)}"
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
    return {"raw_text": text, "flags": [], "validation_summary": {"sessions_checked": 0, "critical": 0, "warnings": 0, "notes": 0}}, timing
