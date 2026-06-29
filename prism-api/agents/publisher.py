import asyncio
import json

async def _publisher_stream(sage_result: dict, researcher_result: dict, navigator_result: dict, prompt: str, note: str | None = None):
    """Yields chunks of Markdown report from Cerebras based on the 3 parallel agent outputs."""
    from pipeline import client

    system_instruction = prompt
    if note and note.strip():
        system_instruction += f"\n\nCRITICAL DIRECTIVE: The user explicitly asked the following question: '{note}'. You MUST include a dedicated 'Strategic Insight' or 'Direct Answer' section at the top of the report that directly answers this question using the deep research and extracted data."

    stream = client.chat.completions.create(
        model="gemma-4-31b",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"SAGE EXTRACTION:\n{json.dumps(sage_result)}\n\nRESEARCH FINDINGS:\n{json.dumps(researcher_result)}\n\nAPI DATA:\n{json.dumps(navigator_result)}\n\nGenerate the final Markdown artifact now."}
        ],
        stream=True,
        max_tokens=2000,
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
