from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    image_b64: str
    facility_name: str = "Demo Facility"
    form_type: str = "dialysis_monitoring"


class AgentOutput(BaseModel):
    agent_name: str
    content: Optional[dict] = None
    processing_time_ms: Optional[int] = None


class RecordSummary(BaseModel):
    id: str
    patient_name: Optional[str]
    patient_id: Optional[str]
    consultant: Optional[str]
    session_count: int
    critical_flags: int
    warning_flags: int
    overall_status: str
    created_at: str
