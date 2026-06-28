# prism-api — Backend Context for AI Agents

## Stack
Python 3.11 · FastAPI · `cerebras-cloud-sdk` · `google-generativeai` · `supabase` · `python-dotenv`

## File map
```
prism-api/
├── main.py          ← FastAPI app: /api/upload, /api/analyze (SSE), /api/records, /health
├── pipeline.py      ← Orchestrates all 5 agents; yields SSE events; owns streaming helpers
├── prompts.py       ← All five system prompts as module-level constants (SAGE_, ORACLE_, etc.)
├── models.py        ← Pydantic request/response models
├── comparison.py    ← Fires Gemini 2.5 Flash baseline in parallel; returns elapsed ms only
├── storage.py       ← All Supabase calls (upload_image, save_agent_output, save_record, get_records)
├── agents/
│   ├── __init__.py
│   ├── sage.py      ← run_sage() — non-streaming fallback (streaming is in pipeline.py)
│   ├── oracle.py    ← run_oracle() — async, returns validated dict
│   ├── sentinel.py  ← run_sentinel() — async, returns anomaly dict
│   ├── compass.py   ← run_compass() — async, returns structured dict
│   └── echo.py      ← run_echo() — async, returns brief string
├── requirements.txt
├── .env.example
└── CLAUDE.md        ← you are here
```

## Streaming architecture
The Cerebras Python SDK (`cerebras-cloud-sdk`) is **synchronous**. To use it in FastAPI's async context without blocking the event loop:

```python
# Pattern used everywhere for blocking Cerebras calls:
result = await asyncio.to_thread(sync_cerebras_call)

# Pattern for streaming helpers in pipeline.py:
chunks, full_text = await asyncio.to_thread(_collect_chunks_sync)
for chunk in chunks:
    yield chunk  # simulate token-by-token stream to frontend
```

This means the frontend sees streaming (tokens appear progressively) but they are buffered per-agent call. This is intentional — it's simpler and reliable under hackathon time pressure.

## SSE event schema
Every event from `/api/analyze` is a JSON object:

| field | values | meaning |
|-------|--------|---------|
| `agent` | `sage\|oracle\|sentinel\|compass\|echo\|system` | which agent sent this |
| `type` | `status` | agent just activated, `content` = status message |
| `type` | `streaming` | token chunk, `content` = text delta |
| `type` | `done` | agent finished, `ms` = elapsed milliseconds |
| `type` | `speed_data` | Gemini baseline result, `gemini_ms` = total ms |
| `type` | `complete` | full pipeline done, `doc_id` = Supabase record UUID |
| `type` | `error` | something failed, `content` = error string |

## Running locally

**Important — two Python installations on this machine:**
- `python3` / `pip` → Homebrew Python (system-protected, cannot install packages, PEP 668)
- `/opt/miniconda3/bin/python3` → Miniconda Python — this is where all deps are installed

**Always use miniconda python to run the server:**
```bash
cd prism-api
cp .env.example .env   # fill in keys
bash start.sh          # uses /opt/miniconda3/bin/python3 -m uvicorn main:app --reload --port 8000
```

Or directly:
```bash
/opt/miniconda3/bin/python3 -m uvicorn main:app --reload --port 8000
```

To install new packages:
```bash
/opt/miniconda3/bin/pip install <package>
```

## Key invariants
- `pipeline.py` is the ONLY file that instantiates the Cerebras `client` object at module level
- `storage.py` lazily creates the Supabase client on first use (avoids import-time env var check)
- All five agent `.py` files in `agents/` accept `client` as their first argument — never import `client` inside an agent file directly
- The Gemini baseline task is created at the START of the pipeline and awaited at the END (with a 2-second timeout) — this ensures it runs in true parallel with the Cerebras pipeline
