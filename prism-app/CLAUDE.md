# prism-app — Frontend Context for AI Agents

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Lucide React

## File map
```
prism-app/
├── app/
│   ├── layout.tsx              ← Root layout (Space Grotesk font, dark bg)
│   ├── page.tsx                ← Landing page (redirects or hero)
│   ├── analyze/page.tsx        ← Main demo page — wraps InvestigationRoom
│   └── records/
│       ├── page.tsx            ← Records browser grid
│       └── [id]/page.tsx       ← Single record detail view
├── components/
│   ├── InvestigationRoom.tsx   ← Root component wiring upload + agents + panels
│   ├── AgentCard.tsx           ← Streaming agent card (idle/active/done states)
│   ├── UploadZone.tsx          ← Drag-drop image upload + Analyze button
│   ├── SpeedPanel.tsx          ← Dual timer: Cerebras vs GPU baseline
│   ├── StructuredTable.tsx     ← Compass JSON → session rows with status badges
│   ├── AnomalyBadge.tsx        ← CRITICAL/WARNING/NORMAL/NOTE badges
│   └── IntelBrief.tsx          ← Echo markdown output display
├── lib/
│   ├── useSSE.ts               ← SSE consumer hook (not currently used — InvestigationRoom reads inline)
│   └── supabase.ts             ← Supabase browser client
├── components/ui/              ← shadcn/ui generated components
└── CLAUDE.md                   ← you are here
```

## Design system
- **Background:** `#06060f` (near-black)
- **Text:** `#e8eaf6` (soft white)
- **Muted text:** `#8a94b8`, `#454e70`
- **Border:** `white/8` to `white/15`
- **Agent accent colors:**
  - Sage: `#4ade80` (green) — extractor
  - Oracle: `#60a5fa` (blue) — validator
  - Sentinel: `#f59e0b` (amber) — anomaly detector
  - Compass: `#a78bfa` (purple) — structurer
  - Echo: `#f472b6` (pink) — brief writer
- **Font:** Space Grotesk (headings), system mono (code/metrics)

## SSE event consumption
The backend streams newline-delimited `data: {...}` events. InvestigationRoom reads
the response body as a stream, splits on newlines, and parses `data: ` prefixed lines.

Event types the frontend handles:
| type | action |
|------|--------|
| `status` | set agent to active, show statusMsg |
| `streaming` | append content to agent card text |
| `done` | mark agent done, show ms + tps if present |
| `timing` | update speed metrics for the agent's card footer |
| `speed_data` | update GPU baseline ms in SpeedPanel |
| `complete` | pipeline done, set docId for StructuredTable |
| `error` | show error state |

## Key conventions
- All components are `"use client"` (streaming + state require it)
- `process.env.NEXT_PUBLIC_API_URL` points to the FastAPI backend (Railway in prod, `http://localhost:8000` locally)
- Never import from `agents/` or `pipeline.py` — frontend talks only to the FastAPI `/api/*` endpoints
- shadcn components live in `components/ui/` — do not edit them directly, re-run `npx shadcn add` instead
- Framer Motion is used ONLY for entry animations on panel mount — keep it lightweight

## Running locally
```bash
cd prism-app
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
Backend must be running at port 8000 for the analyze page to work.
