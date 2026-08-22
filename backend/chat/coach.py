"""
chat/coach.py — Coach chatbot + pattern aggregation.

POST /chat  → retrieval (project+ai scope, looser threshold 0.35)
             + LLM coaching prompt grounded in experiences
             + cites experience IDs
             + graceful degradation when LLM unavailable

GET /chat/patterns → pure SQL aggregation, top recurring patterns
"""
import json
from typing import Any, Dict, List

from db import get_conn
from llm.gemini_provider import GeminiProvider, LLMUnavailableError
from retrieval.scoring import retrieve

COACH_THRESHOLD = 0.35  # looser than normal retrieval
_llm = GeminiProvider()

_COACH_SYSTEM = """You are a personal debugging coach. Your job is to help the user understand 
their recurring mistakes based ONLY on their stored debugging experiences.

Rules:
- Only draw from the EXPERIENCES provided. Never invent patterns.
- Cite experience IDs using format [#ID] when referencing them.
- If nothing relevant was retrieved, say exactly: "I don't have a pattern for that yet."
- Be concise and actionable. 2-4 sentences max per point.
- Focus on what the user keeps getting wrong and how to avoid it."""


def get_coach_response(message: str) -> Dict[str, Any]:
    """Return coach response + cited experience IDs."""
    # Retrieve with looser threshold, project+ai scope
    results = retrieve(
        problem_text=message,
        scope=["project", "ai", "universal"],
        threshold=COACH_THRESHOLD,
        top_k=5,
    )

    cited_ids = [r["id"] for r in results]

    if not results:
        return {
            "response": "I don't have a pattern for that yet.",
            "cited_experience_ids": [],
        }

    # Build context block for LLM
    exp_context = "\n\n".join(
        f"[#{r['id']}] {r['title']}\n"
        f"Problem: {r['problem_summary']}\n"
        f"Failed: {'; '.join(r.get('failed_approaches', [])[:2])}\n"
        f"Lesson: {r.get('lesson', '')}\n"
        f"Pattern: {'; '.join(r.get('patterns', [])[:3])}"
        for r in results
    )

    user_prompt = (
        f"USER QUESTION:\n{message}\n\n"
        f"RETRIEVED EXPERIENCES:\n{exp_context}\n\n"
        "Based on these experiences, what patterns do you see in the user's debugging?"
    )

    try:
        text = _llm.complete(_COACH_SYSTEM, user_prompt)
        return {"response": text, "cited_experience_ids": cited_ids}
    except LLMUnavailableError:
        # Graceful degradation — show structured data without LLM narrative
        summary_lines = [
            f"[#{r['id']}] {r['title']} — {r.get('lesson', 'no lesson recorded')}"
            for r in results
        ]
        return {
            "response": (
                "[LLM unavailable] Relevant experiences found:\n"
                + "\n".join(summary_lines)
            ),
            "cited_experience_ids": cited_ids,
        }


def get_patterns() -> List[Dict[str, Any]]:
    """
    Pure SQL aggregation — top recurring patterns by frequency.
    No LLM, no embeddings needed.
    """
    conn = get_conn()

    # Aggregate by category
    cat_rows = conn.execute("""
        SELECT category, COUNT(*) as count
        FROM experiences
        WHERE category != 'other'
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()

    # Aggregate patterns (stored as JSON arrays) — extract individual patterns
    # SQLite JSON1: json_each to unnest arrays
    pattern_rows = conn.execute("""
        SELECT json_each.value AS pattern, COUNT(*) AS count
        FROM experiences, json_each(experiences.patterns)
        WHERE json_each.value != ''
        GROUP BY json_each.value
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()

    # Symptom frequency
    symptom_rows = conn.execute("""
        SELECT json_each.value AS symptom, COUNT(*) AS count
        FROM experiences, json_each(experiences.symptoms)
        WHERE json_each.value != ''
        GROUP BY json_each.value
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()

    conn.close()

    return {
        "categories": [{"name": r["category"], "count": r["count"]} for r in cat_rows],
        "patterns": [{"pattern": r["pattern"], "count": r["count"]} for r in pattern_rows],
        "symptoms": [{"symptom": r["symptom"], "count": r["count"]} for r in symptom_rows],
    }
