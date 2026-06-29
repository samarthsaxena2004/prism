# Application Vision and Development Roadmap

## Executive Summary

This document outlines the upgraded vision for the chat interface application. The core pivot is from a generic chat to **industry-specific, multi-agent workflows** centered around structured deliverables (Claude Artifacts style). A key differentiator remains the real-time Cerebras vs. Standard GPU inference comparison using Gemma 4 31B.

Users will select a vertical **before** starting a conversation, triggering a tailored 4-agent pipeline optimized for that domain. The system supports multimodal inputs (images, PDFs, eventually video) and produces rich, interactive Markdown + Mermaid artifacts.

---

## Core User Experience Changes

### Mandatory Category Selection
Before any conversation begins, users **must** select one category:

- **Medical Records**
- **Insurance Claims**
- **Government Forms & Contracts**
- **Financial Reports**
- **Logistics**

This selection determines the specialized multi-agent workflow, prompts, and integrations.

### Multimodal Input
- Users can upload **images**, **PDFs**, or **videos**.
- Processing flows through the coordinated agentic pipeline.

### Output Style
- Every interaction should produce a **rich, interactive deliverable** (Markdown reports, Mermaid diagrams, visualizations) rather than plain chat responses.
- Long-term goal: Evolve toward a Claude Artifacts-like interface.

### Dual-Stack Showcase
- The application will **continuously demonstrate** real-time comparisons between:
  - **Cerebras** (Gemma 4 31B) — highlighting low latency and high throughput.
  - **Traditional GPU stack** (e.g., via OpenRouter).
- Identical multi-agent workflows executed on both for fair comparison.

---

## Agentic Pipeline (Canonical 4-Agent Structure)

For every request, the system routes through this coordinated pipeline:

1. **Document Understanding Agent**
   - Parses uploaded documents (images/PDFs).
   - Extracts structured information, entities, and context.
   - Includes validation/anomaly detection (missing info, risks, compliance issues).

2. **Research & Web Intelligence Agent**
   - Performs intelligent web research using parsed context.
   - Sources: Google Search, Reddit, official docs, web scraping (Tavily or equivalent).

3. **API Orchestration Agent**
   - Integrates with external services/APIs as needed:
     - Maps APIs (Logistics)
     - Government APIs
     - Insurance services
     - Others relevant to the vertical.

4. **Reporting & Visualization Agent**
   - Produces comprehensive **Markdown reports**.
   - Generates **Mermaid diagrams** for workflows, relationships, etc.
   - Presents polished, artifact-style output.

### Vertical-Specific Optimizations

- **Medical Records**: Analyze reports, explain diagnoses, summarize history, highlight issues, generate healthcare reports.
- **Insurance Claims**: Review claims, identify gaps/weaknesses, recommend fixes, estimate approval readiness.
- **Government Forms & Contracts**: Compliance reviews, obligation summaries, risk identification, audit assistance.
- **Financial Reports**: Statement analysis, trend detection, revenue insights, executive summaries.
- **Logistics**: Route optimization, map generation, workflow analysis, location-aware reports.

---

## Technical & Architectural Considerations

### Alignment with Current Architecture
- Current agents (Sage/Oracle/Sentinel/Compass/Echo) need mapping/restructuring.
- **Document Understanding** evolves from Sage (vision) + Oracle/Sentinel (validation).
- **Research & Web Intelligence**: Brand new (leverage Tavily).
- **API Orchestration**: Brand new.
- **Reporting & Visualization**: Evolves from Compass + Echo.

### Critical Decision Points (Forks)

1. **Honest Dual-Stack Inference**
   - Run **real** workflows on both Cerebras (Gemma 4 31B) and GPU provider.
   - Remove simulation/faked timings.
   - Accept potential GPU slowness/rate-limits as part of the demonstration.
   - Requires fixing `comparison.py` import and baseline.

2. **Agent Structure**
   - Adopt the exact 4-agent pipeline as canonical.
   - Fold validation/anomaly detection into Document Understanding or keep as structured outputs.

3. **Hero Vertical for Initial Implementation**
   - Fully implement one vertical end-to-end.
   - Recommended: **Logistics** (visual maps/artifacts) or **Medical Records**.
   - Scaffold the rest.

4. **Multimodal Scope**
   - Images: Immediate.
   - PDFs: Via page-to-image conversion.
   - Video: Deferred (frame sampling).

### Proposed Phased Implementation Plan

**Phase 0 (Immediate)**
- Fix broken baseline import in comparison logic.
- Verify OpenRouter model IDs.
- Enable real Cerebras vs. GPU numbers (retire simulation).

**Phase 1**
- Refactor `run_prism_pipeline` to 4-agent structure.
- Implement per-vertical prompts (extend `get_prompts_for_category`).
- Maintain SSE streaming + dual-engine execution.

**Phase 2**
- Build Research & Web Intelligence Agent (Tavily integration).

**Phase 3**
- Enhance Reporting Agent for Markdown + Mermaid.
- Frontend: Artifact panel to render rich outputs.

**Phase 4**
- Implement API Orchestration for the chosen hero vertical.

**Phase 5**
- Full PDF support.
- Video support later.

---

## Goals & Success Metrics

- **User Value**: Domain experts get specialized, actionable deliverables quickly.
- **Tech Showcase**: Clear, side-by-side performance advantage of Cerebras hardware.
- **Maintainability**: Clean separation of concerns per agent and vertical.
- **Extensibility**: Easy to add new verticals or agents.

## Next Steps for Coding Agent

1. Review current codebase structure (agents, main pipeline, frontend).
2. Confirm decisions on the 4 forks above.
3. Start with **Phase 0** fixes.
4. Provide file-level implementation plan once direction is locked.

**Timeline Note**: Clarify any hard deadlines (hackathon vs. longer product build).

---

*This document serves as the single source of truth for the product vision and technical direction. Update it as decisions evolve.*

---
**Version**: 1.0  
**Date**: 2026-06-29
