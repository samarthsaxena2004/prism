# PRISM — Project Context for AI Agents

## What this is
Prism is a multi-agent document intelligence platform built for the Google DeepMind × Cerebras Hackathon. It digitizes handwritten medical forms (starting with dialysis monitoring charts from Indian hospitals) using five coordinated AI agents running on Gemma 4 31B via Cerebras.

**Deadline:** 10:30 PM IST, June 29 2026 — solo developer build.

## Repo layout
```
Prisma/
├── CLAUDE.md                      ← you are here
├── prism_execution_blueprint.md   ← full spec, code, prompts, hour-by-hour plan
├── prism-api/                     ← FastAPI backend (Python)
│   └── CLAUDE.md                  ← backend-specific context
└── prism-app/                     ← Next.js 15 frontend (TypeScript)
    └── CLAUDE.md                  ← frontend-specific context
```

The blueprint (`prism_execution_blueprint.md`) is the authoritative source of truth for every architectural decision, all five agent prompts, the database schema, and the submission copy. Read it before making structural changes.

**`HACKATHON_RULES.md` is a hard-constraint file** — treat every rule in it as non-negotiable. Key constraints that affect code: always use `gemma-4-31b` (exact string), always pass images as base64 data URIs (never hosted URLs), never set `reasoning_effort`, always extract and emit `response.time_info` per agent call.

## Tech decisions (final, do not relitigate)
- **Model:** `gemma-4-31b` on Cerebras for all five agents
- **Baseline:** `google/gemma-4-31b-it:free` on OpenRouter fires simultaneously for the live speed comparison panel only
- **Streaming:** Server-Sent Events from FastAPI → Next.js (no WebSockets)
- **DB/Storage:** Supabase (PostgreSQL + file storage)
- **Frontend:** Next.js 15 App Router + Tailwind + shadcn/ui + Framer Motion

## Agent pipeline (fixed order)
```
SAGE → (parallel) ORACLE + SENTINEL → COMPASS → ECHO
```
- **Sage** — vision extraction of all fields from handwritten form image
- **Oracle** — clinical validation against established safe ranges
- **Sentinel** — anomaly + data quality detection (runs parallel with Oracle)
- **Compass** — structures validated data into a clean JSON database record
- **Echo** — writes a ≤120-word clinical intelligence brief

## Working rhythm
- Build backend first, validate Gemma 4 vision on a real form, then wire frontend
- Each agent lives in `prism-api/agents/<name>.py`
- Streaming helpers (`_sage_stream`, `_compass_stream`, `_echo_stream`) live in `pipeline.py`
- Oracle and Sentinel are non-streaming; they run via `asyncio.to_thread()` wrapping the sync Cerebras SDK
- Do not refactor unless something is broken — time pressure is extreme

## Environment variables needed
```
CEREBRAS_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
GOOGLE_API_KEY
OPENROUTER_API_KEY (for Gemma 4 GPU baseline)
TAVILY_API_KEY   (optional — Oracle uses web search fallback)
```
Copy `prism-api/.env.example` to `prism-api/.env` and fill in keys.

## Form images
Real dialysis monitoring form images are at `/Users/samarthsaxena/Documents/dialysis/` (1.png–14.png). Do not commit these. Use them only for local testing. The demo must use a fictional patient (see blueprint Part 13).
