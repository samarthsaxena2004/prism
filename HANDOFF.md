# Handoff: Align GPU pipeline with Cerebras research pipeline

## Why
Cerebras runs 4-agent research (`sage / researcher / navigator / publisher`)
for every category. GPU still runs old 5-agent (`sage / oracle / sentinel /
compass / echo`). Frontend `gpuPipeline = INITIAL_RESEARCH_PIPELINE` only
knows the 4. GPU events for `oracle/sentinel/compass/echo` are silently
dropped — GPU column stalls after Sage. Breaks the "identical workflow,
only hardware differs" claim.

## Files
- `prism-api/comparison.py` — `run_gpu_pipeline(image_b64, form_type)`
- `prism-api/research_pipeline.py` — reference shape (Cerebras side)
- `prism-api/main.py:87` — branches Cerebras on `form_type=="dialysis_monitoring"`

## Tasks
1. In `comparison.py`, branch `run_gpu_pipeline` on `form_type`:
   - `dialysis_monitoring` → keep current 5-agent (sage/oracle∥sentinel/compass/echo)
   - else → mirror research_pipeline: sage(vision) → researcher∥navigator → publisher
   - Reuse `_pick_model`, `_gpu_call`, `_chunk_stream`. Single model for whole run.
   - For researcher/navigator use hardcoded prompts matching research_pipeline.py
     (`research_prompt`, `nav_prompt`) — keep symmetry; do NOT call Tavily/external
     APIs from GPU side (Cerebras side has them mocked too).
   - Publisher: vision-free text call; stream chunks like Cerebras `_publisher_stream`.
   - Final event still `gpu_pipeline_done` with `total_ms`, `tps`, `model`.

2. Verify no other file consumes the old GPU agent IDs (oracle/sentinel/compass/echo
   under `engine:'gpu'`). Frontend just looks up by id — no extra wiring needed.

3. Compile-check: `python3 -m py_compile prism-api/comparison.py`
4. Smoke-test by running one analyze request and confirming GPU column
   shows all 4 research agents update.

## Out of scope (separate cleanups, do NOT bundle)
- Dead `dialysis_monitoring` branch in main.py + chat-interface.tsx (no card maps to it)
- research_pipeline.py ignores `prompts["RESEARCHER"|"NAVIGATOR"|"PUBLISHER"]`
- Dead imports in `agents/sage.py|compass.py|echo.py` (unused, inert)

## Commit message
`Mirror GPU pipeline to research 4-agent shape for honest comparison`
