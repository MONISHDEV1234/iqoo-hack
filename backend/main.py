"""
main.py — FastAPI core for MistakeMemo.

Role 1 owns:
  POST /session/extract
  POST /llm/ask

Role 2 owns (stubs here for CORS / integration readiness):
  GET/POST /experiences
  GET      /experiences/{id}
  POST     /retrieve
  POST     /report
  POST     /chat
  GET      /chat/patterns
  GET      /dashboard/stats
"""
import json
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from db import get_conn, init_db
from schemas import (
    ExperienceCreate,
    ExperienceOut,
    ExtractRequest,
    ExtractResponse,
    LLMAskRequest,
    LLMAskResponse,
)
from extraction.llm_extract import extract as do_extract
from llm.gemini_provider import GeminiProvider, LLMUnavailableError


# ─── Startup ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="MistakeMemo API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for prod; fine for local hackathon
    allow_methods=["*"],
    allow_headers=["*"],
)

_llm = GeminiProvider()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _row_to_experience(row) -> Dict[str, Any]:
    d = dict(row)
    for field in ("symptoms", "error_codes", "technologies", "patterns",
                  "hypotheses", "attempts", "failed_approaches"):
        if isinstance(d.get(field), str):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                d[field] = []
    for field in ("context", "verification"):
        if isinstance(d.get(field), str):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                d[field] = {}
    return d


def _insert_experience(exp: Dict[str, Any], conn=None) -> int:
    close = conn is None
    if conn is None:
        conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO experiences
          (scope, title, problem_summary, symptoms, error_codes, context,
           category, technologies, patterns, hypotheses, attempts,
           failed_approaches, successful_approach, root_cause, solution,
           verification, lesson, recommended_next_action, confidence,
           project, source, embedding)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        exp.get("scope", "project"),
        exp.get("title", ""),
        exp.get("problem_summary", ""),
        json.dumps(exp.get("symptoms", [])),
        json.dumps(exp.get("error_codes", [])),
        json.dumps(exp.get("context", {})),
        exp.get("category", "other"),
        json.dumps(exp.get("technologies", [])),
        json.dumps(exp.get("patterns", [])),
        json.dumps(exp.get("hypotheses", [])),
        json.dumps(exp.get("attempts", [])),
        json.dumps(exp.get("failed_approaches", [])),
        exp.get("successful_approach", ""),
        exp.get("root_cause", ""),
        exp.get("solution", ""),
        json.dumps(exp.get("verification", {})),
        exp.get("lesson", ""),
        exp.get("recommended_next_action", ""),
        float(exp.get("confidence", 0.0)),
        exp.get("project", ""),
        exp.get("source", "manual"),
        None,  # embedding — Role 2 will compute and write this
    ))
    conn.commit()
    row_id = cur.lastrowid
    if close:
        conn.close()
    return row_id


# ─── Role 1 endpoints ─────────────────────────────────────────────────────────

@app.post("/session/extract", response_model=ExtractResponse)
async def session_extract(req: ExtractRequest):
    """
    Accept raw buffer events or pasted text, extract a structured experience.
    LLM path with deterministic fallback.
    """
    if not req.events and not req.raw_text:
        raise HTTPException(400, "Provide either 'events' or 'raw_text'")

    events_raw = [e.model_dump() for e in req.events] if req.events else None
    exp_dict, source_used = do_extract(
        events=events_raw,
        raw_text=req.raw_text,
        project=req.project,
    )

    # Persist the extracted experience
    conn = get_conn()
    exp_id = _insert_experience(exp_dict, conn)

    # Log session if workspace provided
    session_id: Optional[int] = None
    if req.workspace:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO sessions (workspace, source, extracted_experience_count)
            VALUES (?, ?, 1)
        """, (req.workspace, "import" if req.raw_text else "live"))
        conn.commit()
        session_id = cur.lastrowid
    conn.close()

    return ExtractResponse(
        experience=ExperienceCreate(**exp_dict),
        source_used=source_used,
        session_id=session_id,
    )


@app.post("/llm/ask", response_model=LLMAskResponse)
async def llm_ask(req: LLMAskRequest):
    """
    Ask the LLM with or without memory (report_text).
    with_memory: includes the MISTAKEMEMO_REPORT in the prompt.
    without_memory: plain problem text only — used for the demo before/after.
    """
    if req.mode == "with_memory" and req.report_text:
        user_prompt = (
            f"PROBLEM:\n{req.problem_text}\n\n"
            f"PRIOR EXPERIENCE REPORT:\n{req.report_text}\n\n"
            "Using the prior experience as context, give your best next action."
        )
        system_prompt = (
            "You are an expert debugging assistant. You have access to a "
            "MISTAKEMEMO_REPORT containing relevant prior debugging experiences. "
            "Use it to give a more informed, specific response. "
            "Acknowledge which prior experience is relevant and why."
        )
    else:
        user_prompt = f"PROBLEM:\n{req.problem_text}\n\nWhat should I try next?"
        system_prompt = (
            "You are an expert debugging assistant. Give a helpful, specific response."
        )

    try:
        text = _llm.complete(system_prompt, user_prompt)
        return LLMAskResponse(response=text, mode=req.mode)
    except LLMUnavailableError as e:
        return LLMAskResponse(
            response=f"[LLM unavailable: {e}] Use the structured report data above.",
            mode=req.mode,
            provider="unavailable",
        )


# ─── Role 2 endpoint stubs (so extension + web app can build against them) ────

@app.get("/experiences")
async def list_experiences(
    scope: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    """Role 2 owns this — stub returns real data from DB (no retrieval scoring)."""
    conn = get_conn()
    cur = conn.cursor()
    sql = "SELECT * FROM experiences WHERE 1=1"
    params: List[Any] = []
    if scope:
        sql += " AND scope = ?"
        params.append(scope)
    if category:
        sql += " AND category = ?"
        params.append(category)
    if q:
        sql += " AND (problem_summary LIKE ? OR lesson LIKE ?)"
        params += [f"%{q}%", f"%{q}%"]
    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    rows = cur.execute(sql, params).fetchall()
    conn.close()
    return [_row_to_experience(r) for r in rows]


@app.get("/experiences/{exp_id}")
async def get_experience(exp_id: int):
    conn = get_conn()
    row = conn.execute("SELECT * FROM experiences WHERE id=?", (exp_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Experience not found")
    return _row_to_experience(row)


@app.post("/experiences", status_code=201)
async def create_experience(exp: ExperienceCreate):
    exp_dict = exp.model_dump()
    exp_dict["source"] = "manual"
    exp_id = _insert_experience(exp_dict)
    conn = get_conn()
    row = conn.execute("SELECT * FROM experiences WHERE id=?", (exp_id,)).fetchone()
    conn.close()
    return _row_to_experience(row)


@app.post("/retrieve")
async def retrieve(body: Dict[str, Any]):
    """Role 2 stub — returns empty list until Role 2 wires retrieval scoring."""
    return {"results": [], "note": "Role 2 retrieval not yet wired"}


@app.post("/report")
async def report(body: Dict[str, Any]):
    """Role 2 stub."""
    return {"report": "", "note": "Role 2 report builder not yet wired"}


@app.post("/chat")
async def chat(body: Dict[str, Any]):
    """Role 2 stub."""
    return {"response": "", "cited_experience_ids": []}


@app.get("/chat/patterns")
async def chat_patterns():
    """Role 2 stub."""
    return {"patterns": []}


@app.get("/dashboard/stats")
async def dashboard_stats():
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) FROM experiences").fetchone()[0]
    conn.close()
    return {
        "total_experiences": total,
        "note": "Full stats wired by Role 2",
    }


# ─── Dev runner ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
