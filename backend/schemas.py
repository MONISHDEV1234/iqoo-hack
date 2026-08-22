"""
schemas.py — Pydantic models for the locked API contract.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal


# ─── Shared sub-models ────────────────────────────────────────────────────────

class ExperienceContext(BaseModel):
    language: str = ""
    framework: List[str] = []
    libraries: List[str] = []
    env: str = ""

class Attempt(BaseModel):
    hypothesis: str = ""
    action: str = ""
    result: str = ""
    evidence: str = ""

class Verification(BaseModel):
    passed: int = 0
    failed: int = 0


# ─── Experience ───────────────────────────────────────────────────────────────

class ExperienceCreate(BaseModel):
    scope: Literal["project", "ai", "universal"] = "project"
    title: str = ""
    problem_summary: str
    symptoms: List[str] = []
    error_codes: List[str] = []
    context: ExperienceContext = Field(default_factory=ExperienceContext)
    category: str = "other"
    technologies: List[str] = []
    patterns: List[str] = []
    hypotheses: List[str] = []
    attempts: List[Attempt] = []
    failed_approaches: List[str] = []
    successful_approach: str = ""
    root_cause: str = ""
    solution: str = ""
    verification: Verification = Field(default_factory=Verification)
    lesson: str = ""
    recommended_next_action: str = ""
    confidence: float = 0.0
    project: str = ""
    source: Literal["autocapture", "manual", "import", "seed"] = "manual"

class ExperienceOut(ExperienceCreate):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# ─── Session Extract ──────────────────────────────────────────────────────────

class BufferEvent(BaseModel):
    ts: int
    type: Literal["terminal", "diagnostic", "file_save"]
    data: Dict[str, Any]

class ExtractRequest(BaseModel):
    events: Optional[List[BufferEvent]] = None
    raw_text: Optional[str] = None
    project: str = ""
    workspace: str = ""

class ExtractResponse(BaseModel):
    experience: ExperienceCreate
    source_used: Literal["llm", "fallback"]  # which extraction path ran
    session_id: Optional[int] = None


# ─── LLM Ask ─────────────────────────────────────────────────────────────────

class LLMAskRequest(BaseModel):
    problem_text: str
    report_text: Optional[str] = None
    mode: Literal["with_memory", "without_memory"] = "with_memory"

class LLMAskResponse(BaseModel):
    response: str
    mode: str
    provider: str = "gemini"
