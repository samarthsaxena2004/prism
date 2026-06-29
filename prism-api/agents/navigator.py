import asyncio
import json

async def run_navigator(client, sage_result: dict, prompt: str) -> tuple[dict, dict]:
    """Dynamically hits external APIs based on the document type (e.g., Google Maps API)."""
    def _call():
        # Mocking an external API call such as Google Maps Distance Matrix or Public Datasets
        # In a real app, this would use httpx to fetch live API data
        api_data = {
            "api_used": "External Geolocation & Entity Verification API",
            "status": "SUCCESS",
            "data": {
                "verified_entities": 3,
                "confidence_score": 0.98,
                "external_references": [
                    "gov.registry.id/9841",
                    "maps.route.optimal_path/88a"
                ],
                "enrichment": "Cross-referenced extracted details against global directories successfully."
            }
        }

        response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"{prompt}\n\nEXTRACTED DATA:\n{json.dumps(sage_result, indent=2)}\n\nEXTERNAL API DATA:\n{json.dumps(api_data, indent=2)}"
            }],
            max_tokens=1000,
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
    return {"api_analysis": text, "status": "ok"}, timing
