# PRISM — HACKATHON AGENT CONTEXT FILE
# Cerebras × Google DeepMind Gemma 4 Hackathon
# READ THIS BEFORE WRITING ANY CODE OR MAKING ANY DECISION
#
# This file is the authoritative reference for all hackathon rules, constraints,
# and judging criteria. Every AI agent, developer, and coding tool assisting
# with this project must treat these rules as non-negotiable.
# ─────────────────────────────────────────────────────────────────────────────

## WHO THIS FILE IS FOR
# This file is context for: Claude Code, Windsurf SWE, Gemini CLI, Cursor,
# and any other AI agent assisting with building the Prism project.
# Treat every line in the CONSTRAINTS section as a hard rule.
# If a feature or architectural decision conflicts with these rules, do NOT
# implement it — flag it instead.

---

## SECTION 1 — CRITICAL CONSTRAINTS (NEVER VIOLATE THESE)

### 1.1 Model Constraints
- ONLY model allowed: gemma-4-31b (this is the ONLY Gemma 4 variant on Cerebras)
- Model ID string: "gemma-4-31b" (exact string, no variations)
- Cerebras MUST be the primary model powering the solution
- Other providers (e.g., Gemini) are allowed ONLY as comparison baselines
- DO NOT use any other model as the primary agent — not GPT, not Claude, not Gemini
- Gemini 2.5 Flash is allowed ONLY for the side-by-side speed comparison panel

### 1.2 API Constraints
- Base URL: https://api.cerebras.ai/v1 (standard Cerebras Inference API)
- Authentication: CEREBRAS_API_KEY as Bearer token (standard key, no special endpoint)
- Rate limits: 100 RPM (requests per minute), 100K TPM (tokens per minute)
- Context window: 65K MSL (Max Sequence Length), 32K MCL (Max Context Length)
- Image input format: Base64-encoded data URIs ONLY
  - Correct: {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
  - WRONG: {"type": "image_url", "image_url": {"url": "https://hosted-url.com/image.jpg"}}
  - Hosted image URLs are NOT supported — always convert to base64 first
- Tool calling: Supported with strict: true — use it for structured extraction
- Structured outputs: Supported — use JSON schema enforcement where possible
- Reasoning mode: OFF by default. To enable: set reasoning_effort to "low", "medium", or "high"
  - For Prism agents: keep reasoning OFF (none) for speed — we want 1500 TPS, not slower thinking
- Timing info: Available in every response as response.time_info (use for speed demonstration)

### 1.3 Submission Constraints
- Deadline: Monday June 29, 10:00 AM Pacific Time (PT) = 10:30 PM IST
- Video: Maximum 60 seconds — HARD LIMIT, do not exceed
- Video MUST show Cerebras speed clearly (required, not optional)
- Video SHOULD include side-by-side speed comparison with a GPU-based provider
- Twitter post REQUIRED for Track 2 — must tag @Cerebras and @googlegemma
- Discord: Separate post for each track you submit to (3 separate posts for 3 tracks)
- Can update/resubmit multiple times before the deadline

### 1.4 Project Integrity Constraints
- Scaffolding/boilerplate is allowed — the core project must be built during hackathon
- The Prism document intelligence pipeline IS the core project (must be built now)
- All five agents (Sage, Oracle, Sentinel, Compass, Echo) must actually function
- The demo must use REAL Gemma 4 31B inference, not mocked responses
- Privacy: No real patient data visible in the demo video
  - Use fictional patient names and IDs on demo forms
  - Never show real API keys, emails, or credentials on screen

---

## SECTION 2 — THE THREE PRIZE TRACKS AND JUDGING CRITERIA

### TRACK 1 — Multiverse Agents ($2,000)
Channel: #g4hackathon-multiverse-agents

Judging Criteria (all four must be satisfied):

  1. AGENT COLLABORATION
     - Judges look for: Effective coordination between multiple AI agents
     - What Prism does: 5 agents with explicit handoffs — Sage output → Oracle+Sentinel input
       → Compass input → Echo synthesis. Oracle and Sentinel run in parallel.
     - How to maximize score: Show the agent communication visually in the UI.
       Each agent receives and references the previous agents' outputs in its system prompt.
     - DO NOT: Make agents run independently with no shared context.

  2. MULTIMODAL INTELLIGENCE
     - Judges look for: Meaningful use of Gemma 4 31B with text, images, and video
     - What Prism does: Gemma 4 31B vision reads handwritten dialysis forms — this is a
       harder and more impressive multimodal task than reading printed content.
     - How to maximize score: Sage must use actual image_url with base64 image.
       The vision capability must be central, not peripheral.
     - DO NOT: Reduce the image to OCR output and then process text only.
       The model must read the raw image.

  3. SPEED IN ACTION
     - Judges look for: Demonstrates the impact of Cerebras ultra-fast inference
     - What Prism does: Live dual-timer showing Cerebras pipeline (12s) vs Gemini
       baseline (47s+) running simultaneously in the UI.
     - How to maximize score: Show time_info data in the UI. Show TTFT and TPS per agent.
       The Gemini baseline timer must keep running after Prism finishes.
     - DO NOT: Just mention speed in text. It must be visibly demonstrated.

  4. INNOVATION
     - Judges look for: Creative, outside-the-box applications including physical AI,
       robotics, embodied agents, real-world systems (Reachy robots, IoT, manufacturing, labs)
     - What Prism does: Digitizing paper medical records from Indian dialysis units is a
       genuine real-world system problem with measurable economic and health impact.
     - How to maximize score: Frame the enterprise value clearly. Emphasize that this solves
       a physical-world problem (paper → digital) not just a software problem.
     - Note: We do NOT have robotics/physical AI. Compensate by emphasizing "real-world
       operational systems" language and the scale of the problem we solve.

---

### TRACK 2 — People's Choice ($2,000)
Channel: #g4hackathon-people-choice
ALSO REQUIRED: Post on X/Twitter tagging @Cerebras and @googlegemma

Judging Criteria:

  1. ORGANIC REACH — Most impressions on Twitter/X (no paid promotion)
     - Post the Twitter thread EARLY (recommended: 8:00 AM IST June 29 = peak Indian tech activity)
     - Hook tweet must be immediately understandable and emotionally resonant
     - Include the demo video directly in the first tweet (not a link — embed it)

  2. COMMUNITY ENGAGEMENT — Likes, comments, reposts, discussions
     - Reply to every comment on the thread
     - Share in relevant communities: medical AI, Indian healthcare tech, AI builders
     - Ask people to repost by making the value proposition immediately clear

  3. CONTENT QUALITY — Clear, compelling, creative showcase
     - The 60-second video IS the primary content — make it visually dramatic
     - The before/after of messy handwritten form → clean structured data is the visual hook
     - Include the speed comparison moment (Cerebras ✓ vs GPU still spinning)

  4. AUTHENTICITY — Genuine community excitement
     - Personal connection to healthcare (Indore hospitals context) is authentic and compelling
     - DO NOT post anything that feels corporate or AI-generated in tone
     - The story must be real: "I've seen these forms filled out by hand. I built something."

---

### TRACK 3 — Enterprise Impact ($1,000)
Channel: #g4hackathon-enterprise-impact

Judging Criteria:

  1. BUSINESS IMPACT — Solves meaningful enterprise challenge
     - Examples given by judges: enterprise search, multimodal RAG, incident response,
       cybersecurity, customer support, knowledge management
     - What Prism does: Medical record digitization → knowledge management + data quality
     - Quantify impact in submission: "20 min/form × 15 forms/day = 5 hrs nursing time saved
       per unit per day. 800,000 CKD patients in India. 2.5M dialysis sessions/year."
     - ABDM (Ayushman Bharat Digital Mission) compatibility is a bonus mention

  2. PRODUCTION READINESS — Scalable, secure, deployable
     - Must have: Real database (Supabase), real deployment (Vercel + Railway)
     - Must have: Structured JSON output that a real HIS could consume
     - Must have: Error handling, not just happy-path code
     - Must have: Live demo URL that judges can actually visit
     - Mention in README: auth-ready architecture, HTTPS by default

  3. TECHNICAL EXCELLENCE — Thoughtful architecture, high-quality implementation
     - The async parallel agent execution (Oracle + Sentinel simultaneously) shows architectural care
     - SSE streaming shows real-time UX thinking
     - Supabase integration shows production database thinking
     - Five distinct agents with clear separation of concerns

  4. AI DIFFERENTIATION — How Cerebras speed + Gemma 4 multimodal creates better enterprise UX
     - Key claim: At GPU speeds, this is a batch job. At Cerebras speeds, it's real-time.
     - 5 agents × 8-10 model calls: impossible to deliver as interactive UX at 100 TPS
     - At 1,500 TPS: clinical teams get structured records instantly after each session
     - This is the AI differentiation story — write it explicitly in the submission

---

## SECTION 3 — PROJECT: PRISM
## Medical Document Intelligence Platform

### What Prism is:
A multi-agent AI platform that digitizes handwritten medical records from Indian hospitals.
Demonstrated with dialysis monitoring forms from Shri Vaishnav Diagnostic & Kidney Centre, Indore.

### The Five Agents (DO NOT change their roles or the pipeline without good reason):

  1. SAGE (Vision Extractor)
     - Tool: Gemma 4 31B vision (base64 image input)
     - Input: Raw form image as base64
     - Output: Structured JSON of all extracted fields
     - Critical rule: Uses actual image, not OCR text

  2. ORACLE (Clinical Validator)
     - Tool: Gemma 4 31B text (no image — uses Sage's output)
     - Input: Sage's extracted JSON
     - Output: Validation flags with severity levels
     - Runs in parallel with Sentinel

  3. SENTINEL (Anomaly Detector)
     - Tool: Gemma 4 31B text (no image — uses Sage's output)
     - Input: Sage's extracted JSON
     - Output: Anomaly report with severity levels
     - Runs in parallel with Oracle

  4. COMPASS (Data Structurer)
     - Tool: Gemma 4 31B text (no image)
     - Input: Sage + Oracle + Sentinel outputs
     - Output: Clean standardized JSON record for database storage

  5. ECHO (Intelligence Brief)
     - Tool: Gemma 4 31B text (no image)
     - Input: All previous agent outputs
     - Output: 120-word clinical intelligence brief (human-readable)

### Pipeline Flow:
  Sage → (Oracle ∥ Sentinel) → Compass → Echo
  (Oracle and Sentinel execute in parallel — asyncio.gather())

### Submission Tracks:
  - Track 1: Multi-agent + multimodal (Sage uses vision) ✓
  - Track 2: Twitter hook "Paper forms. 12 seconds. 5 AI agents." ✓
  - Track 3: Enterprise medical digitization platform ✓

---

## SECTION 4 — TECHNICAL IMPLEMENTATION RULES

### DO implement:
- All 5 agents calling gemma-4-31b (not mocked, real inference)
- Sage using image_url with base64 — this is mandatory for Track 1 multimodal
- SSE streaming from FastAPI to Next.js frontend
- Live timer showing elapsed time during pipeline run
- Gemini 2.5 Flash baseline comparison (fires simultaneously, displayed in UI)
- Supabase for structured record storage (demonstrates production readiness)
- Response time_info extraction per agent (for speed visualization)
- Error handling and graceful degradation

### DO NOT implement:
- Any hosted image URLs for Gemma 4 (not supported — use base64 only)
- reasoning_effort set to anything other than "none" or omitted
  (keep it off — we want 1500 TPS, reasoning slows it down significantly)
- Any model other than gemma-4-31b as the primary agent
- Mock responses in production code (judges must see real inference)
- Real patient data in demo video (use fictional test data only)
- Paid Twitter promotion for Track 2
- Features that take more than 2-3 hours to build (not enough time remaining)

### Gemma 4 Image Input — Correct Implementation:
```python
# CORRECT — base64 data URI
response = client.chat.completions.create(
    model="gemma-4-31b",
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
            },
            {"type": "text", "text": "Your prompt here"}
        ]
    }],
    max_tokens=2000,
)

# WRONG — hosted URL (not supported)
{"type": "image_url", "image_url": {"url": "https://example.com/form.jpg"}}
```

### Extracting Speed Metrics:
```python
response = client.chat.completions.create(model="gemma-4-31b", ...)

# time_info is available on every response
time_info = response.time_info
ttft_ms = round(time_info.prompt_time * 1000)       # Time to first token
generation_time = time_info.completion_time          # Time for generation
tps = round(response.usage.completion_tokens / generation_time)  # Tokens per second

# Send these to the frontend via SSE for display
yield {"type": "timing", "agent": "sage", "ttft_ms": ttft_ms, "tps": tps}
```

---

## SECTION 5 — SUBMISSION CHECKLIST

Before submitting, verify EVERY item:

### Technical
  [ ] Gemma 4 31B (gemma-4-31b) is the primary model for all 5 agents
  [ ] Sage uses base64 image input (not hosted URL)
  [ ] All 5 agents produce real AI output (not mocked)
  [ ] SSE streaming works in the deployed app
  [ ] Speed comparison panel shows live timers (Cerebras vs Gemini)
  [ ] Supabase records are being saved after pipeline completion
  [ ] Live demo URL works (Vercel + Railway deployed)
  [ ] GitHub repo is public

### Demo Video
  [ ] 60 seconds or LESS (hard limit — measure it twice)
  [ ] Shows Cerebras speed advantage clearly (dual timer visible)
  [ ] Shows all 5 agents activating in sequence
  [ ] Demo form uses fictional patient data (no real patient names/IDs)
  [ ] No API keys, credentials, or personal info visible on screen
  [ ] Uploaded to YouTube (unlisted or public, link ready)

### Discord Submissions (3 separate posts)
  [ ] Track 1 posted in #g4hackathon-multiverse-agents
  [ ] Track 2 posted in #g4hackathon-people-choice
  [ ] Track 3 posted in #g4hackathon-enterprise-impact
  [ ] Each post includes: video link, project description, GitHub link, live demo link

### Twitter (required for Track 2)
  [ ] Tweet posted with demo video
  [ ] Tagged @Cerebras in tweet
  [ ] Tagged @googlegemma in tweet
  [ ] Thread has at least 3 follow-up tweets
  [ ] Posted at high-engagement time (recommended: 7-9 AM IST June 29)

### README
  [ ] Explains what the project does in plain language
  [ ] Lists all 5 agents with their roles
  [ ] Includes setup instructions
  [ ] Mentions Gemma 4 31B on Cerebras prominently
  [ ] Includes the speed comparison numbers

---

## SECTION 6 — COMMON MISTAKES TO AVOID

| Mistake | Why it's wrong | What to do instead |
|---------|---------------|-------------------|
| Using a hosted URL for image input | Not supported by Cerebras API | Always base64-encode images |
| Setting reasoning_effort = "high" for agents | Makes responses slower, costs more tokens | Keep reasoning off (default) for Prism agents |
| Using Gemini/GPT as primary agent | Violates the hackathon rule — Cerebras must be primary | Use Gemma 4 31B on Cerebras for all 5 agents |
| Making Gemini the primary model for speed | The comparison must be fair — Gemini fires same prompt | Gemini only runs Sage prompt for baseline comparison |
| Video longer than 60 seconds | Hard disqualification risk | Trim ruthlessly — time it multiple times |
| Single Discord post for all 3 tracks | Rules require separate post per track | Three separate Discord messages |
| Posting Twitter without tagging @Cerebras @googlegemma | Required for Track 2 consideration | Always include both handles in main tweet |
| Showing real patient data in demo | Privacy rule + ethical obligation | Use fictional data on blank form |
| Mocking agent responses | Judges expect real inference | All 5 agents must make real Cerebras API calls |
| Building too many features | Leads to nothing being polished | Focus: agents work + UI is good + video is strong |

---

## SECTION 7 — TIMELINE REFERENCE

| PT Time | IST Time | Event |
|---------|----------|-------|
| Sun Jun 28, 10:00 AM PT | Sun Jun 28, 10:30 PM IST | Hackathon starts |
| Sun Jun 28, 10:30 AM PT | Sun Jun 28, 11:00 PM IST | Cerebras support window opens |
| Sun Jun 28, 12:30 PM PT | Sun Jun 28, 1:00 AM IST | Cerebras support window closes |
| Mon Jun 29, 9:00 AM PT | Mon Jun 29, 9:30 PM IST | Final Cerebras support window |
| Mon Jun 29, 10:00 AM PT | Mon Jun 29, 10:30 PM IST | SUBMISSION DEADLINE |

Current status: Hackathon is active. ~22 hours remain from start.
Priority: Get Gemma 4 31B vision test working on dialysis form photo first.
If API test fails: Report immediately in Cerebras Discord for support.

---

## SECTION 8 — API RATE LIMIT MANAGEMENT

Elevated limits: 100 RPM, 100K TPM
For a full Prism pipeline run (5 agents, 8-10 calls):
- Each call: ~500-1500 tokens input + ~300-500 tokens output
- Approximate per-run token usage: ~10,000-15,000 tokens
- At 100K TPM: can run ~7-10 full pipelines per minute
- This is very comfortable for development and demo use

If rate limits are hit:
- Add retry with exponential backoff (max 3 retries)
- Add 1-second delay between agents if needed
- Do NOT use reasoning_effort — it increases token usage significantly

---

## SECTION 9 — THE SINGLE MOST IMPORTANT THING

The judges will see dozens of projects. Most will have working demos.
The ones that win will have demos where you UNDERSTAND the impact in 5 seconds.

For Prism, that five-second understanding is:
"Paper forms. Handwritten. Digitized by 5 AI agents. In 12 seconds."

Every architectural decision, every UI element, every line of the demo script
must serve that understanding. If a feature doesn't make that story clearer,
it should be cut or deferred.

The speed comparison is the proof.
The dialysis form is the human story.
The five agents are the technical substance.
Together they form a complete judging narrative for all three tracks.

---

## DOCUMENT METADATA
# Created: June 29, 2026, 12:15 AM IST
# Hackathon: Cerebras × Google DeepMind Gemma 4 (June 28-29, 2026)
# Project: Prism — Medical Document Intelligence Platform
# Model: gemma-4-31b (Cerebras)
# This file should be present in every AI agent's context window
# when making any implementation or architectural decision for this project.
