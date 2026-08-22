"""
retrieval/scoring.py — Weighted retrieval formula from CORE_WORKING.md §6.

Score = 0.45*semantic + 0.15*error_match + 0.15*framework_match
      + 0.05*language_match + 0.10*pattern_overlap + 0.10*symptom_overlap

Confidence threshold: 0.55 (configurable).
"""
import json
import math
from typing import Any, Dict, List, Optional, Tuple

from db import get_conn
from retrieval.embeddings import embed, from_blob, cosine

CONFIDENCE_THRESHOLD = 0.35  # semantic alone clears this for good matches
FTS_CANDIDATE_LIMIT = 30
TOP_K = 5


def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(s.lower() for s in a), set(s.lower() for s in b)
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _parse_json_field(val: Any, default) -> Any:
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return default
    return val or default


def retrieve(
    problem_text: str,
    scope: Optional[List[str]] = None,
    threshold: float = CONFIDENCE_THRESHOLD,
    top_k: int = TOP_K,
) -> List[Dict[str, Any]]:
    """
    Returns ranked list of experiences with feature breakdown.
    Returns empty list with a note if nothing clears the threshold.
    """
    query_vec = embed(problem_text)

    # ── 1. Extract signals from problem text (lightweight) ────────────────
    problem_lower = problem_text.lower()
    # Rough token set for symptom overlap
    problem_tokens = set(problem_lower.split())

    conn = get_conn()

    # ── 2. FTS5 candidate pull ────────────────────────────────────────────
    scope_clause = ""
    scope_params: List[Any] = []
    if scope:
        placeholders = ",".join("?" * len(scope))
        scope_clause = f" AND e.scope IN ({placeholders})"
        scope_params = list(scope)

    fts_sql = f"""
        SELECT e.*
        FROM experiences e
        JOIN experiences_fts fts ON fts.rowid = e.id
        WHERE experiences_fts MATCH ?{scope_clause}
        ORDER BY rank
        LIMIT {FTS_CANDIDATE_LIMIT}
    """
    # Build FTS query — tokenize problem text, join with OR
    fts_terms = " OR ".join(
        f'"{w}"' for w in problem_text.split()[:20] if len(w) > 1
    )
    if not fts_terms:
        fts_terms = f'"{problem_text[:50]}"'

    try:
        rows = conn.execute(fts_sql, [fts_terms] + scope_params).fetchall()
    except Exception:
        rows = []

    # Fallback: if FTS returns nothing or errors, scan all (bounded by scope)
    if not rows:
        fallback_sql = f"SELECT * FROM experiences WHERE 1=1{scope_clause} LIMIT {FTS_CANDIDATE_LIMIT}"
        rows = conn.execute(fallback_sql, scope_params).fetchall()

    conn.close()

    if not rows:
        return []

    # ── 3. Score each candidate ────────────────────────────────────────────
    results: List[Dict[str, Any]] = []

    for row in rows:
        r = dict(row)

        # Semantic similarity
        if r.get("embedding"):
            cand_vec = from_blob(r["embedding"])
            semantic = cosine(query_vec, cand_vec)
        else:
            semantic = 0.0

        cand_errors = _parse_json_field(r.get("error_codes"), [])

        # Parse context cleanly — it's always a JSON string from SQLite
        ctx = _parse_json_field(r.get("context"), {})
        if not isinstance(ctx, dict):
            ctx = {}
        cand_frameworks = ctx.get("framework", []) or []
        cand_language = ctx.get("language", "") or ""

        cand_patterns = _parse_json_field(r.get("patterns"), [])
        cand_symptoms = _parse_json_field(r.get("symptoms"), [])

        # Extract lightweight signals from problem text using regex
        import re as _re
        prob_tokens_lower = problem_text.lower().split()
        # Detect frameworks in problem text
        _fw_keywords = {
            "fastapi": "fastapi", "django": "django", "flask": "flask",
            "react": "react", "vue": "vue", "nextjs": "nextjs",
            "sqlalchemy": "sqlalchemy", "pytest": "pytest", "nginx": "nginx",
        }
        prob_frameworks = [v for k, v in _fw_keywords.items() if k in prob_tokens_lower]
        # Detect language in problem text
        _lang_keywords = {"python": "python", "typescript": "typescript",
                          "javascript": "javascript", "go": "go", "rust": "rust"}
        prob_language = next((v for k, v in _lang_keywords.items() if k in prob_tokens_lower), "")
        # Error codes (e.g. 422, 401, 500)
        prob_errors = _re.findall(r'\b[45]\d{2}\b', problem_text)

        error_match = 1.0 if (prob_errors and set(prob_errors) & set(str(e) for e in cand_errors)) else 0.0
        framework_match = _jaccard(prob_frameworks, cand_frameworks)
        language_match = 1.0 if (prob_language and prob_language.lower() == cand_language.lower()) else 0.0
        pattern_overlap = _jaccard(prob_tokens_lower, set(" ".join(cand_patterns).lower().split()))
        symptom_overlap = _jaccard(problem_tokens, set(" ".join(cand_symptoms).lower().split()))

        score = (
            0.45 * semantic
            + 0.15 * error_match
            + 0.15 * framework_match
            + 0.05 * language_match
            + 0.10 * pattern_overlap
            + 0.10 * symptom_overlap
        )

        if score < threshold:
            continue

        context = _parse_json_field(r.get("context"), {})
        verification = _parse_json_field(r.get("verification"), {})

        results.append({
            "id": r["id"],
            "score": round(score, 4),
            "score_pct": round(score * 100, 1),
            "feature_breakdown": {
                "semantic": round(semantic, 4),
                "error_match": round(error_match, 4),
                "framework_match": round(framework_match, 4),
                "language_match": round(language_match, 4),
                "pattern_overlap": round(pattern_overlap, 4),
                "symptom_overlap": round(symptom_overlap, 4),
            },
            "title": r.get("title", ""),
            "problem_summary": r.get("problem_summary", ""),
            "symptoms": cand_symptoms,
            "error_codes": cand_errors,
            "patterns": cand_patterns,
            "failed_approaches": _parse_json_field(r.get("failed_approaches"), []),
            "successful_approach": r.get("successful_approach", ""),
            "root_cause": r.get("root_cause", ""),
            "lesson": r.get("lesson", ""),
            "recommended_next_action": r.get("recommended_next_action", ""),
            "scope": r.get("scope", "project"),
            "category": r.get("category", "other"),
            "context": context,
            "verification": verification,
            "confidence": r.get("confidence", 0.0),
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
