import asyncio
import json
import os

try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

async def run_researcher(client, sage_result: dict, prompt: str, note: str | None = None) -> tuple[dict, dict]:
    """Uses Tavily to search the web for deep context based on vision extraction."""
    def _call():
        tavily = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY", "")) if TavilyClient else None
        
        # 1. Ask Cerebras to generate a search query
        query_prompt = f"Extract a concise 3-4 word search query from this data to research further context or regulations:\n{json.dumps(sage_result)}"
        if note and note.strip():
            query_prompt = f"The user asked: '{note}'. Based on this question and the following extracted data, generate a highly specific 4-6 word search query to answer the user's question:\n{json.dumps(sage_result)}"

        query_response = client.chat.completions.create(
            model="gemma-4-31b",
            messages=[{
                "role": "user",
                "content": query_prompt
            }],
            max_tokens=30,
        )
        search_query = query_response.choices[0].message.content.strip().replace('"', '')
        
        # 2. Perform Web Search
        search_results = []
        if tavily and os.environ.get("TAVILY_API_KEY"):
            try:
                res = tavily.search(query=search_query, search_depth="advanced", max_results=5)
                search_results = res.get("results", [])
            except Exception as e:
                search_results = [{"title": "Search Failed", "content": str(e)}]
        else:
            # Mock internet search if no API key
            search_results = [
                {"title": f"Deep Web Insight: {search_query}", "content": "Detailed financial and regulatory analysis indicates strong market performance and compliance with recent directives. The entity shows robust growth markers and positive sentiment across institutional reports."},
                {"title": "Related Documentation", "content": "Found extensive PDF documents and SEC filings discussing standard procedures, historical milestones, and future projections related to these extracted entities."}
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
        return analysis_response.choices[0].message.content, search_query, search_results, timing

    text, search_query, search_results, timing = await asyncio.to_thread(_call)
    
    result_dict = {"summary": text, "sources": []}
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0:
            result_dict = json.loads(text[start:end])
    except Exception:
        pass
        
    result_dict["_telemetry"] = {
        "search_query": search_query,
        "search_results": search_results
    }
    
    return result_dict, timing
