# MistakeMemo — Backend API Reference for Role 3

Base URL: `http://localhost:8000`

Docs (Swagger): `http://localhost:8000/docs`

## Quick Start

```bash
cd backend
pip install -r requirements.txt
python seed/seed_memories.py    # one-time: seeds 20 experiences with embeddings
uvicorn main:app --reload       # starts on :8000
```

Copy `.env.example` → `.env` and set `GEMINI_API_KEY` for LLM features.

---

## Endpoints

### `GET /dashboard/stats`
No body. Returns counts for the dashboard.
```json
{
  "total_experiences": 21,
  "total_recalls": 4,
  "recalls_used_in_report": 2,
  "experiences_by_scope": { "project": 18, "universal": 3 },
  "experiences_by_category": { "api": 2, "database": 3, ... },
  "total_sessions": 1
}
```

---

### `GET /experiences`
Query params: `scope`, `category`, `q` (full-text search), `limit` (default 50).
```
GET /experiences?q=fastapi&scope=project&limit=10
```
Returns array of experience objects (see schema below).

### `GET /experiences/{id}`
Returns single experience object.

### `POST /experiences`
Body: experience object (all fields optional except `problem_summary`).
Returns: created experience with `id`.

---

### `POST /retrieve`
```json
{ "problem_text": "FastAPI 422 error on POST", "scope": ["project", "universal"] }
```
Returns ranked experiences with **feature breakdown** (for the Retrieval Inspector view):
```json
{
  "results": [
    {
      "id": 2,
      "score": 0.63,
      "score_pct": 63.0,
      "feature_breakdown": {
        "semantic": 0.70,
        "error_match": 1.0,
        "framework_match": 1.0,
        "language_match": 0.0,
        "pattern_overlap": 0.12,
        "symptom_overlap": 0.08
      },
      "title": "FastAPI 422 on POST — missing required field",
      "problem_summary": "...",
      "symptoms": [...],
      "lesson": "...",
      ...
    }
  ],
  "count": 1,
  "threshold_used": 0.35
}
```
If nothing found: `{ "results": [], "message": "No sufficiently relevant experience found.", "threshold_used": 0.35 }`

---

### `POST /report`
Two modes:

**Mode 1 — pass ranked_results directly (preferred, no extra DB round-trip):**
```json
{
  "ranked_results": [ ... ],   // from /retrieve response.results
  "current_problem": "FastAPI 422 error"
}
```

**Mode 2 — pass experience IDs:**
```json
{
  "experience_ids": [2, 5],
  "current_problem": "FastAPI 422 error"
}
```

Returns:
```json
{ "report": "<MISTAKEMEMO_REPORT>\n...\n</MISTAKEMEMO_REPORT>", "experience_count": 1 }
```

---

### `POST /llm/ask`
```json
{
  "problem_text": "FastAPI keeps returning 422",
  "report_text": "<MISTAKEMEMO_REPORT>...</MISTAKEMEMO_REPORT>",
  "mode": "with_memory"
}
```
`mode`: `"with_memory"` | `"without_memory"`

Returns:
```json
{ "response": "Based on your prior experience...", "mode": "with_memory", "provider": "gemini" }
```
If LLM unavailable: returns `{ "response": "[LLM unavailable: ...]", "provider": "unavailable" }` — **never crashes**.

---

### `POST /chat`
```json
{ "message": "What do I keep messing up with FastAPI?" }
```
Returns:
```json
{
  "response": "Based on experiences [#2] and [#7], you frequently...",
  "cited_experience_ids": [2, 7]
}
```
If nothing relevant: `{ "response": "I don't have a pattern for that yet.", "cited_experience_ids": [] }`

---

### `GET /chat/patterns`
No body. Returns top recurring patterns (pure SQL, no LLM):
```json
{
  "categories": [{ "name": "api", "count": 3 }, ...],
  "patterns": [{ "pattern": "pydantic validation", "count": 2 }, ...],
  "symptoms": [{ "symptom": "422 Unprocessable Entity", "count": 2 }, ...]
}
```

---

### `POST /session/extract`
```json
{
  "raw_text": "paste terminal output here...",
  "project": "my-project",
  "workspace": "/path/to/workspace"
}
```
Or with events array (from extension):
```json
{ "events": [{ "ts": 1234567, "type": "terminal", "data": {...} }] }
```
Returns:
```json
{
  "experience": { ...all fields... },
  "source_used": "llm",
  "session_id": 3
}
```
`source_used`: `"llm"` | `"fallback"` (always succeeds, LLM failure → fallback, no crash)

---

## Experience Object Schema

```json
{
  "id": 2,
  "scope": "project",
  "title": "FastAPI 422 on POST — missing required field",
  "problem_summary": "...",
  "symptoms": ["422 Unprocessable Entity", "..."],
  "error_codes": ["422"],
  "context": { "language": "python", "framework": ["fastapi"], "libraries": ["pydantic"], "env": "local" },
  "category": "api",
  "technologies": ["python", "fastapi", "pydantic"],
  "patterns": ["missing required field", "pydantic validation"],
  "hypotheses": [...],
  "attempts": [{ "hypothesis": "...", "action": "...", "result": "...", "evidence": "..." }],
  "failed_approaches": ["..."],
  "successful_approach": "...",
  "root_cause": "...",
  "solution": "...",
  "verification": { "passed": 5, "failed": 0 },
  "lesson": "...",
  "recommended_next_action": "...",
  "confidence": 0.92,
  "project": "api-project",
  "source": "seed",
  "created_at": "2026-08-22T...",
  "updated_at": "2026-08-22T..."
}
```

## CORS
All origins allowed (`*`) in dev mode — no config needed for the React frontend.
