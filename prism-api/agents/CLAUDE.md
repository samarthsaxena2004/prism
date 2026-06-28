# agents/ — Agent Module Context for AI Agents

## Purpose
Each file here implements one of the five Prism agents as a standalone async function. All agents receive the Cerebras `client` as their first argument — they do not import it themselves.

## Agent contracts

### sage.py — `run_sage(client, image_b64: str) -> dict`
- Input: base64-encoded JPEG of a handwritten dialysis form
- Output: raw extracted dict with `header` (patient info) and `sessions` (list of session rows)
- Note: the **streaming** version of Sage lives in `pipeline.py` as `_sage_stream()`. `run_sage()` here is a non-streaming fallback used for testing.

### oracle.py — `run_oracle(client, sage_result: dict) -> dict`
- Input: Sage's extracted dict
- Output: `{"validation_summary": {...}, "flags": [...]}`
- Validates every numerical value against clinical safe ranges (BP, pulse, weight, UF rate)
- Runs **in parallel** with Sentinel inside `pipeline.py`

### sentinel.py — `run_sentinel(client, sage_result: dict) -> dict`
- Input: Sage's extracted dict
- Output: `{"anomaly_count": N, "data_quality_score": 0-100, "anomalies": [...]}`
- Checks for temporal, mathematical, missing-field, duplicate, physiological, and format anomalies
- Runs **in parallel** with Oracle inside `pipeline.py`

### compass.py — `run_compass(client, sage, oracle, sentinel) -> dict`
- Input: all three prior agent results
- Output: clean structured record with per-session status (`NORMAL|NEEDS_ATTENTION|CRITICAL`) and a summary
- Fallback: if Compass returns unparseable JSON, `pipeline.py` proceeds with `{"raw_text": ...}`

### echo.py — `run_echo(client, sage, oracle, sentinel, compass) -> str`
- Input: all prior agent results
- Output: plain markdown string, ≤120 words, formatted as the clinical intelligence brief
- The streaming version lives in `pipeline.py` as `_echo_stream()`

## Adding a new agent
1. Create `agents/<name>.py` with an async function following the pattern above
2. Import it in `pipeline.py` and add it to the yield sequence
3. Update the pipeline SSE schema docs in `prism-api/CLAUDE.md`
4. Add a system prompt constant to `prompts.py`

## Error handling convention
Every agent wraps its Cerebras call in `asyncio.to_thread()`. If the call fails or returns unparseable JSON, agents return a safe fallback dict (never raise). The pipeline will still complete — it just passes the fallback downstream. This keeps the SSE stream alive even if one agent misbehaves.
