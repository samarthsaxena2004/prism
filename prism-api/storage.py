"""Supabase integration for file storage and database operations."""
import os
import asyncio
from supabase import create_client

_supabase = None


def _get_client():
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_ANON_KEY"]
        )
    return _supabase


async def upload_image(image_bytes: bytes, doc_id: str) -> str:
    """Upload form image to Supabase Storage. Returns public URL."""
    def _upload():
        sb = _get_client()
        filename = f"{doc_id}.jpg"
        sb.storage.from_("forms").upload(
            filename,
            image_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        return sb.storage.from_("forms").get_public_url(filename)

    return await asyncio.to_thread(_upload)


async def save_document(doc_id: str, facility_name: str, form_type: str, image_url: str = None):
    """Create the initial document row."""
    def _insert():
        try:
            _get_client().table("documents").insert({
                "id": doc_id,
                "facility_name": facility_name,
                "form_type": form_type,
                "raw_image_url": image_url,
                "status": "processing",
            }).execute()
        except Exception as e:
            print(f"Failed to create document row: {e}")

    await asyncio.to_thread(_insert)


async def save_agent_output(doc_id: str, agent: str, content: dict, ms: int):
    """Save individual agent output."""
    def _insert():
        try:
            _get_client().table("agent_outputs").insert({
                "document_id": doc_id,
                "agent_name": agent,
                "content": content,
                "processing_time_ms": ms,
            }).execute()
        except Exception as e:
            print(f"Failed to save agent output ({agent}): {e}")

    await asyncio.to_thread(_insert)


async def save_record(doc_id: str, sage, oracle, sentinel, compass, echo: str):
    """Save the complete structured record after all agents finish."""
    def _insert():
        try:
            patient = compass.get("patient", {}) if compass else {}
            summary = compass.get("summary", {}) if compass else {}

            _get_client().table("records").insert({
                "document_id": doc_id,
                "patient_name": patient.get("name", "Unknown"),
                "patient_id": patient.get("id"),
                "consultant": patient.get("consultant"),
                "session_count": summary.get("total_sessions", 0),
                "critical_flags": summary.get("critical", 0),
                "warning_flags": summary.get("needs_attention", 0),
                "structured_data": compass,
                "anomalies": sentinel.get("anomalies", []) if sentinel else [],
                "intelligence_brief": echo,
                "overall_status": summary.get("overall_status", "NORMAL"),
            }).execute()

            _get_client().table("documents").update({"status": "done"}).eq("id", doc_id).execute()
        except Exception as e:
            print(f"Failed to save record: {e}")

    await asyncio.to_thread(_insert)


async def get_records(limit: int = 20, offset: int = 0):
    """Fetch paginated records for the records browser."""
    def _fetch():
        result = _get_client().table("records").select(
            "id, patient_name, patient_id, consultant, session_count, "
            "critical_flags, warning_flags, overall_status, created_at"
        ).order("created_at", desc=True).limit(limit).offset(offset).execute()
        return result.data

    return await asyncio.to_thread(_fetch)


async def get_record_detail(record_id: str):
    """Fetch complete record with all agent outputs."""
    def _fetch():
        record = _get_client().table("records").select("*").eq("id", record_id).single().execute()
        agents = _get_client().table("agent_outputs").select("*").eq(
            "document_id", record.data.get("document_id")
        ).execute()
        return {"record": record.data, "agents": agents.data}

    return await asyncio.to_thread(_fetch)
