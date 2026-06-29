from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    image_b64: str
    facility_name: str = "Demo Facility"
    form_type: str = "enterprise-form"


class AgentOutput(BaseModel):
    agent_name: str
    content: Optional[dict] = None
    processing_time_ms: Optional[int] = None


class RecordSummary(BaseModel):
    id: str
    entity_name: Optional[str]
    entity_id: Optional[str]
    owner: Optional[str]
    record_count: int
    critical_flags: int
    warning_flags: int
    overall_status: str
    created_at: str
