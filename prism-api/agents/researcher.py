import asyncio
import json
import os

try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

async def run_researcher(client, sage_result: dict, prompt: str) -> tuple[dict, dict]:
    """Uses Tavily to search the web for deep context based on vision extraction."""
    def _call():
        tavily = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY", "")) if TavilyClient else None
        
        # 1. Ask Cerebras to generate a search query
        query_response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"Extract a concise 3-4 word search query from this data to research further context or regulations:\n{json.dumps(sage_result)}"
            }],
            max_tokens=20,
        )
        search_query = query_response.choices[0].message.content.strip().replace('"', '')
        
        # 2. Perform Web Search
        search_results = []
        if tavily and os.environ.get("TAVILY_API_KEY"):
            try:
                res = tavily.search(query=search_query, search_depth="advanced", max_results=3)
                search_results = res.get("results", [])
            except Exception as e:
                search_results = [{"title": "Search Failed", "content": str(e)}]
        else:
            # Mock internet search if no API key
            search_results = [
                {"title": f"Deep Web Insight: {search_query}", "content": "Simulated internet research findings indicating relevant regulatory guidelines and historical context found on government databases and Reddit."},
                {"title": "Related Documentation", "content": "Found 3 PDF documents and 2 forum threads discussing standard procedures related to these extracted entities."}
            ]

        # 3. Analyze search results with Cerebras
        analysis_response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": f"{prompt}\n\nSEARCH QUERY: {search_query}\n\nSEARCH RESULTS:\n{json.dumps(search_results, indent=2)}"
            }],
            max_tokens=1000,
        )
        
        timing = {}
        try:
            ti = analysis_response.time_info
            gen_time = ti.completion_time or 1
            timing = {
                "ttft_ms": round(ti.prompt_time * 1000),
                "tps": round(analysis_response.usage.completion_tokens / gen_time),
            }
        except Exception:
            pass
        return analysis_response.choices[0].message.content, timing

    text, timing = await asyncio.to_thread(_call)
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0:
            return json.loads(text[start:end]), timing
    except Exception:
        pass
    return {"summary": text, "sources": []}, timing
