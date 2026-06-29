"""
Deterministic enterprise-insight engine.

Turns the raw agent outputs (Sage / Oracle / Sentinel / Compass) into the
quantified, HIS-relevant signals that make Prism more than a speed demo:

  - extraction confidence (% of fields captured cleanly)
  - data-quality score (from Sentinel)
  - a prioritized human-review queue (merged Oracle flags + Sentinel anomalies)
  - operational ROI (nursing minutes + ₹ saved vs manual transcription)
  - throughput (measured tokens/sec across the pipeline)

Everything here is computed in plain Python — no extra model call, no DB
dependency — so it is fast, reproducible, and safe to run in the demo.
The field-level logic is intentionally domain-agnostic: it walks whatever
structured record the pipeline produced, so the same numbers appear for any
document type, not just dialysis forms.
"""

from __future__ import annotations

# --- Tunable estimates (documented assumptions, not magic numbers) ----------
# Manual handling cost of one paper form, used for the ROI calculation.
BASE_FORM_MINUTES = 6.0          # locate, read, set up data entry
MINUTES_PER_SESSION_ROW = 2.5    # transcribe + file one session row by hand
NURSE_HOURLY_INR = 250.0         # representative nursing cost per hour (India)

_UNCLEAR_TOKENS = {"", "[unclear]", "unclear", "n/a", "na", "none", "null", "-", "—", "?"}
_SEVERITY_RANK = {"CRITICAL": 0, "HIGH": 1, "WARNING": 2, "MEDIUM": 3, "NOTE": 4, "LOW": 5}


def _is_filled(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip().lower() not in _UNCLEAR_TOKENS
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


def _count_fields(obj) -> tuple[int, int]:
    """Return (total_leaf_fields, filled_leaf_fields)."""
    if isinstance(obj, dict):
        total = filled = 0
        for v in obj.values():
            t, f = _count_fields(v)
            total += t
            filled += f
        return total, filled
    if isinstance(obj, list):
        total = filled = 0
        for v in obj:
            t, f = _count_fields(v)
            total += t
            filled += f
        return total, filled
    return 1, (1 if _is_filled(obj) else 0)


def _pick_record(compass, sage) -> dict:
    """Prefer Compass's clean record; fall back to Sage's raw extraction."""
    if isinstance(compass, dict) and ("sessions" in compass or "entity" in compass):
        return compass
    if isinstance(sage, dict):
        return sage
    return {}


def _session_count(compass, sage) -> int:
    for src in (compass, sage):
        if isinstance(src, dict):
            sessions = src.get("sessions")
            if isinstance(sessions, list) and sessions:
                return len(sessions)
    return 1


def _build_review_queue(oracle, sentinel) -> list[dict]:
    queue: list[dict] = []

    flags = oracle.get("flags", []) if isinstance(oracle, dict) else []
    for fl in flags if isinstance(flags, list) else []:
        if not isinstance(fl, dict):
            continue
        sev = str(fl.get("severity", "NOTE")).upper()
        if sev not in ("CRITICAL", "WARNING"):
            continue
        queue.append({
            "source": "Oracle",
            "severity": sev,
            "label": str(fl.get("field") or "Domain value"),
            "detail": str(fl.get("concern") or fl.get("value") or "").strip(),
            "session": fl.get("session"),
        })

    anomalies = sentinel.get("anomalies", []) if isinstance(sentinel, dict) else []
    for an in anomalies if isinstance(anomalies, list) else []:
        if not isinstance(an, dict):
            continue
        sev = str(an.get("severity", "LOW")).upper()
        if sev not in ("HIGH", "MEDIUM"):
            continue
        queue.append({
            "source": "Sentinel",
            "severity": sev,
            "label": str(an.get("type") or "Anomaly").title(),
            "detail": str(an.get("description") or "").strip(),
            "session": (an.get("sessions_affected") or [None])[0]
            if isinstance(an.get("sessions_affected"), list) else None,
        })

    queue.sort(key=lambda q: _SEVERITY_RANK.get(q["severity"], 9))
    return queue


def _avg_tps(timings: dict) -> int | None:
    vals = [
        t["tps"] for t in (timings or {}).values()
        if isinstance(t, dict) and isinstance(t.get("tps"), (int, float)) and t["tps"] > 0
    ]
    return round(sum(vals) / len(vals)) if vals else None


def compute_insights(sage, oracle, sentinel, compass, timings, pipeline_ms: int) -> dict:
    """Build the full insight payload streamed to the frontend."""
    record = _pick_record(compass, sage)
    total_fields, filled_fields = _count_fields(record)
    confidence = round(100 * filled_fields / total_fields) if total_fields else None

    quality = None
    if isinstance(sentinel, dict) and isinstance(sentinel.get("data_quality_score"), (int, float)):
        quality = round(sentinel["data_quality_score"])

    sessions = _session_count(compass, sage)
    review_queue = _build_review_queue(oracle, sentinel)
    critical = sum(1 for q in review_queue if q["severity"] in ("CRITICAL", "HIGH"))
    warnings = len(review_queue) - critical

    manual_minutes = round(BASE_FORM_MINUTES + sessions * MINUTES_PER_SESSION_ROW, 1)
    pipeline_minutes = pipeline_ms / 60000.0
    minutes_saved = round(max(manual_minutes - pipeline_minutes, 0.0), 1)
    rupees_saved = round(manual_minutes / 60.0 * NURSE_HOURLY_INR)

    return {
        "extraction_confidence": confidence,   # 0-100 or None
        "data_quality_score": quality,         # 0-100 or None
        "fields_captured": filled_fields,
        "fields_total": total_fields,
        "sessions_processed": sessions,
        "review_queue": review_queue,
        "review_count": len(review_queue),
        "critical_count": critical,
        "warning_count": warnings,
        "throughput_tps": _avg_tps(timings),
        "roi": {
            "manual_estimate_min": manual_minutes,
            "pipeline_seconds": round(pipeline_ms / 1000.0, 1),
            "minutes_saved": minutes_saved,
            "rupees_saved": rupees_saved,
            "nurse_hourly_inr": NURSE_HOURLY_INR,
        },
    }
