"""
main.py — FastAPI core for MistakeMemo.

Role 1 owns:  POST /session/extract,  POST /llm/ask
Role 2 owns:  GET/POST /experiences,  POST /retrieve,  POST /report,
              POST /chat,  GET /chat/patterns,  GET /dashboard/stats
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
    ExtractRequest,
    ExtractResponse,
    LLMAskRequest,
    LLMAskResponse,
)
from extraction.llm_extract import extract as do_extract
from llm.gemini_provider import GeminiProvider, LLMUnavailableError
from retrieval.scoring import retrieve as do_retrieve
from reporting.report_builder import build_report
from chat.coach import get_coach_response, get_patterns


# ─── Startup ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="MistakeMemo API",
    version="1.0.0",
    description="Local-first experience-learning layer for AI-assisted debugging.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_llm = GeminiProvider()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _row_to_dict(row) -> Dict[str, Any]:
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
    # Remove blob from API responses
    d.pop("embedding", None)
    return d


def _insert_experience(exp: Dict[str, Any], conn=None) -> int:
    close = conn is None
    if conn is None:
        conn = get_conn()

    # Compute embedding for new experience
    embedding_blob = None
    try:
        from retrieval.embeddings import embed, to_blob
        embed_text = " ".join([
            exp.get("problem_summary", ""),
            " ".join(exp.get("symptoms", [])),
            exp.get("lesson", ""),
            " ".join(exp.get("patterns", [])),
        ])
        embedding_blob = to_blob(embed(embed_text))
    except Exception:
        pass  # Embedding is optional — retrieval will just skip semantic for this entry

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
        embedding_blob,
    ))
    conn.commit()
    row_id = cur.lastrowid
    if close:
        conn.close()
    return row_id


def _log_recall(query: str, experience_id: int, score: float,
                feature_breakdown: dict, used_in_report: bool = False):
    try:
        conn = get_conn()
        conn.execute("""
            INSERT INTO recall_events
              (query, experience_id, retrieval_score, feature_breakdown, used_in_report)
            VALUES (?,?,?,?,?)
        """, (query, experience_id, score, json.dumps(feature_breakdown),
              1 if used_in_report else 0))
        conn.commit()
        conn.close()
    except Exception:
        pass  # recall logging is best-effort


# ─── Role 1: Session Extract ──────────────────────────────────────────────────

@app.post("/session/extract", response_model=ExtractResponse, tags=["Role1"])
async def session_extract(req: ExtractRequest):
    """Accept raw buffer events or pasted text, extract a structured experience."""
    if not req.events and not req.raw_text:
        raise HTTPException(400, "Provide either 'events' or 'raw_text'")

    events_raw = [e.model_dump() for e in req.events] if req.events else None
    exp_dict, source_used = do_extract(
        events=events_raw, raw_text=req.raw_text, project=req.project,
    )
    conn = get_conn()
    exp_id = _insert_experience(exp_dict, conn)

    session_id: Optional[int] = None
    if req.workspace:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO sessions (workspace, source, extracted_experience_count)
            VALUES (?,?,1)
        """, (req.workspace, "import" if req.raw_text else "live"))
        conn.commit()
        session_id = cur.lastrowid
    conn.close()

    return ExtractResponse(
        experience=ExperienceCreate(**exp_dict),
        source_used=source_used,
        session_id=session_id,
    )


# ─── Role 1: LLM Ask ──────────────────────────────────────────────────────────

@app.post("/llm/ask", response_model=LLMAskResponse, tags=["Role1"])
async def llm_ask(req: LLMAskRequest):
    """Ask the LLM with or without memory (report_text)."""
    if req.mode == "with_memory" and req.report_text:
        system_prompt = (
            "You are an expert debugging assistant. You have access to a "
            "MISTAKEMEMO_REPORT containing relevant prior debugging experiences. "
            "Use it to give a more informed, specific response. "
            "Acknowledge which prior experience is relevant and why."
        )
        user_prompt = (
            f"PROBLEM:\n{req.problem_text}\n\n"
            f"PRIOR EXPERIENCE REPORT:\n{req.report_text}\n\n"
            "Using the prior experience as context, give your best next action."
        )
    else:
        system_prompt = "You are an expert debugging assistant. Give a helpful, specific response."
        user_prompt = f"PROBLEM:\n{req.problem_text}\n\nWhat should I try next?"

    try:
        text = _llm.complete(system_prompt, user_prompt)
        return LLMAskResponse(response=text, mode=req.mode)
    except LLMUnavailableError as e:
        return LLMAskResponse(
            response=f"[LLM unavailable: {e}] Use the structured report data above.",
            mode=req.mode, provider="unavailable",
        )


# ─── Role 2: Experiences CRUD ─────────────────────────────────────────────────

@app.get("/experiences", tags=["Role2"])
async def list_experiences(
    scope: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    """List experiences, filterable by scope/category/full-text query."""
    conn = get_conn()
    if q:
        # Use FTS5 for search
        from retrieval.scoring import _parse_json_field
        fts_terms = " OR ".join(
            f'"{w}"' for w in q.split()[:10] if len(w) > 2
        ) or q
        scope_clause = " AND e.scope = ?" if scope else ""
        cat_clause = " AND e.category = ?" if category else ""
        params: List[Any] = [fts_terms]
        if scope:
            params.append(scope)
        if category:
            params.append(category)
        params.append(limit)
        rows = conn.execute(f"""
            SELECT e.* FROM experiences e
            JOIN experiences_fts fts ON fts.rowid = e.id
            WHERE experiences_fts MATCH ?{scope_clause}{cat_clause}
            ORDER BY rank LIMIT ?
        """, params).fetchall()
    else:
        sql = "SELECT * FROM experiences WHERE 1=1"
        params = []
        if scope:
            sql += " AND scope=?"
            params.append(scope)
        if category:
            sql += " AND category=?"
            params.append(category)
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


@app.get("/experiences/{exp_id}", tags=["Role2"])
async def get_experience(exp_id: int):
    conn = get_conn()
    row = conn.execute("SELECT * FROM experiences WHERE id=?", (exp_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Experience not found")
    return _row_to_dict(row)


@app.post("/experiences", status_code=201, tags=["Role2"])
async def create_experience(exp: ExperienceCreate):
    """Manual experience creation — also computes embedding."""
    exp_dict = exp.model_dump()
    exp_dict["source"] = "manual"
    exp_id = _insert_experience(exp_dict)
    conn = get_conn()
    row = conn.execute("SELECT * FROM experiences WHERE id=?", (exp_id,)).fetchone()
    conn.close()
    return _row_to_dict(row)


# ─── Role 2: Retrieve ─────────────────────────────────────────────────────────

@app.post("/retrieve", tags=["Role2"])
async def retrieve(body: Dict[str, Any]):
    """
    Hybrid retrieval: FTS5 + MiniLM cosine + weighted formula.
    Returns ranked experiences with per-feature breakdown.
    """
    problem_text = body.get("problem_text", "")
    scope = body.get("scope", None)  # list or None
    if not problem_text:
        raise HTTPException(400, "problem_text required")

    results = do_retrieve(problem_text, scope=scope)

    # Log recall events
    for r in results:
        _log_recall(
            query=problem_text,
            experience_id=r["id"],
            score=r["score"],
            feature_breakdown=r["feature_breakdown"],
            used_in_report=False,
        )

    if not results:
        return {
            "results": [],
            "message": "No sufficiently relevant experience found.",
            "threshold_used": 0.55,
        }

    return {
        "results": results,
        "count": len(results),
        "threshold_used": 0.55,
    }


# ─── Role 2: Report ───────────────────────────────────────────────────────────

@app.post("/report", tags=["Role2"])
async def report(body: Dict[str, Any]):
    """
    Build deterministic MISTAKEMEMO_REPORT from given experience IDs.
    Also accepts inline ranked results (from /retrieve) to avoid extra DB round-trip.
    """
    experience_ids: List[int] = body.get("experience_ids", [])
    current_problem: str = body.get("current_problem", "")
    ranked_results: List[Dict] = body.get("ranked_results", [])

    if ranked_results:
        # Use inline results directly (from /retrieve response)
        report_text = build_report(ranked_results, current_problem)
        for r in ranked_results:
            _log_recall(
                query=current_problem, experience_id=r["id"],
                score=r.get("score", 0), feature_breakdown=r.get("feature_breakdown", {}),
                used_in_report=True,
            )
    elif experience_ids:
        # Fetch from DB
        conn = get_conn()
        rows = conn.execute(
            f"SELECT * FROM experiences WHERE id IN ({','.join('?'*len(experience_ids))})",
            experience_ids,
        ).fetchall()
        conn.close()
        ranked_results = [_row_to_dict(r) for r in rows]
        # Add dummy score fields if missing
        for r in ranked_results:
            r.setdefault("score", 0.9)
            r.setdefault("score_pct", 90)
            r.setdefault("feature_breakdown", {
                "semantic": 0, "error_match": 0, "framework_match": 0,
                "language_match": 0, "pattern_overlap": 0, "symptom_overlap": 0,
            })
        report_text = build_report(ranked_results, current_problem)
        for r in ranked_results:
            _log_recall(
                query=current_problem, experience_id=r["id"],
                score=r.get("score", 0), feature_breakdown=r.get("feature_breakdown", {}),
                used_in_report=True,
            )
    else:
        report_text = build_report([], current_problem)

    return {"report": report_text, "experience_count": len(ranked_results)}


# ─── Role 2: Chat / Coach ─────────────────────────────────────────────────────

@app.post("/chat", tags=["Role2"])
async def chat(body: Dict[str, Any]):
    """Coach chatbot — retrieval + LLM, cites experience IDs, degrades gracefully."""
    message = body.get("message", "")
    if not message:
        raise HTTPException(400, "message required")
    result = get_coach_response(message)
    return result


@app.get("/chat/patterns", tags=["Role2"])
async def chat_patterns():
    """Pure SQL aggregation — top recurring patterns/categories/symptoms."""
    return get_patterns()


# ─── Role 2: Dashboard Stats ──────────────────────────────────────────────────

@app.get("/dashboard/stats", tags=["Role2"])
async def dashboard_stats():
    conn = get_conn()
    total_exp = conn.execute("SELECT COUNT(*) FROM experiences").fetchone()[0]
    total_recalls = conn.execute("SELECT COUNT(*) FROM recall_events").fetchone()[0]
    recalls_in_report = conn.execute(
        "SELECT COUNT(*) FROM recall_events WHERE used_in_report=1"
    ).fetchone()[0]
    by_scope = conn.execute(
        "SELECT scope, COUNT(*) as count FROM experiences GROUP BY scope"
    ).fetchall()
    by_category = conn.execute(
        "SELECT category, COUNT(*) as count FROM experiences GROUP BY category ORDER BY count DESC LIMIT 8"
    ).fetchall()
    sessions = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    conn.close()
    return {
        "total_experiences": total_exp,
        "total_recalls": total_recalls,
        "recalls_used_in_report": recalls_in_report,
        "experiences_by_scope": {r["scope"]: r["count"] for r in by_scope},
        "experiences_by_category": {r["category"]: r["count"] for r in by_category},
        "total_sessions": sessions,
    }


# ─── Dev runner ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
