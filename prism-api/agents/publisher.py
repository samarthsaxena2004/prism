import asyncio
import json

async def _publisher_stream(sage_result: dict, researcher_result: dict, navigator_result: dict, prompt: str):
    from pipeline import client
    
    stream = client.chat.completions.create(
        model="gemma-4-31b",
        messages=[{
            "role": "user",
            "content": f"{prompt}\n\nVISION DATA:\n{json.dumps(sage_result)}\n\nWEB RESEARCH:\n{json.dumps(researcher_result)}\n\nAPI DATA:\n{json.dumps(navigator_result)}"
        }],
        stream=True
    )
    
    full_text = ""
    timing = {}
    
    for chunk in stream:
        if chunk.choices[0].delta.content:
            text = chunk.choices[0].delta.content
            full_text += text
            yield text
            
        if hasattr(chunk, 'time_info') and chunk.time_info:
            ti = chunk.time_info
            gen_time = ti.completion_time or 1
            timing = {
                "ttft_ms": round(ti.prompt_time * 1000),
                "tps": round(chunk.usage.completion_tokens / gen_time) if hasattr(chunk, 'usage') and chunk.usage else None,
            }
            
    yield {"final": True, "data": full_text, "timing": timing}
