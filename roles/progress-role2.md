# Progress — Role 2 (Backend / ML / Retrieval)

Track by checking items off live. If something's blocked, note it under **Blockers** immediately.

## Hour 0:00 – 0:30 — Joint
- [x] Schema locked with Role 1 (`experiences`, `recall_events`, `sessions`)
- [x] API contract locked with Role 1 + Role 3 (`BUILD_PLAN.md`)
- [x] Agreed on seed-data shape (matches the example experience JSON in `CORE_WORKING.md`)

## Hour 0:30 – 3:00
- [x] `db.py` — SQLite + FTS5 virtual table set up per locked schema, JSON1 for structured fields
- [x] `seed/seed_memories.py` — **20 realistic experiences** written (18 project + 3 universal), spanning 7 categories
- [x] Seed data includes 3 curated "universal" scope experiences (for the Universal-scope demo beat)
- [x] Seed script runs cleanly, populates DB, **MiniLM embeddings generated for all 20 seeded experiences** ✅
- [x] MiniLM embedding wrapper (`sentence-transformers/all-MiniLM-L12-v2`) — 384-dim BLOB (`retrieval/embeddings.py`)
- [x] `POST /retrieve` — FTS5 candidate pull + weighted formula (semantic=0.45, error_match=0.15, framework_match=0.15, language_match=0.05, pattern_overlap=0.10, symptom_overlap=0.10) (`retrieval/scoring.py`)
- [x] `/retrieve` returns per-candidate feature breakdown (`feature_breakdown` field on every result) ✅
- [x] Confidence threshold implemented (0.35) — returns "No sufficiently relevant experience found" when nothing clears it ✅
- [x] **Retrieval verified**: "FastAPI 422 validation error POST" → `#2 score=63% (semantic=0.70, error_match=1.00, framework=1.00)` ✅
- [x] `POST /report` — deterministic template, builds from top 1–3 ranked experiences (`reporting/report_builder.py`)
- [x] `GET /experiences` (list, filterable by scope/category/query via FTS5) + `GET /experiences/{id}` (detail)
- [x] `POST /experiences` (manual entry, computes embedding automatically on create)

## Hour 3:00 – 4:15
- [x] `POST /chat` — Coach chatbot: retrieval (project+ai+universal scope, 0.35 threshold) + LLM coaching prompt, cites experience IDs, says "no pattern yet" when nothing relevant (`chat/coach.py`)
- [x] `GET /chat/patterns` — pure SQL aggregation (JSON1 json_each on patterns/categories), returns top patterns + categories + symptoms ✅
- [x] `GET /dashboard/stats` — counts for total_experiences, recalls, by_scope, by_category, sessions ✅
- [x] `recall_events` logged on every `/retrieve` call (query, experience_id, score, feature_breakdown, used_in_report) ✅
- [x] Retrieval formula weights verified against seed data — top match is correct ✅
- [ ] Coach chatbot LLM response tested end-to-end (needs GEMINI_API_KEY in .env)

## Hour 4:15 – 4:45 — Harden
- [x] Fallback confirmed: LLM disabled → `/chat` degrades gracefully (returns formatted experience list, no crash) ✅
- [x] `/retrieve` and `/report` never call LLM — verified (both are fully deterministic) ✅
- [ ] Load a slightly messy/edge-case pasted session through the full pipeline once, confirm no crashes

## Hour 4:45 – 5:00 — Demo rehearsal
- [ ] Ran through backend-side data (seed data, retrieval scores, report output) matching DEMO_SCRIPT.md

## Blockers (update live)
- None

## Notes / decisions made during build
- **Threshold**: 0.35 (semantic alone clears it for clearly relevant matches; FTS fallback to full scan)
- **Embedding text** = `problem_summary + symptoms + lesson + patterns` (richest semantic content)
- FTS5 query wrapped in try/except — special chars (numbers, error codes) can't crash retrieval
- All endpoints are tagged by role in Swagger docs (`/docs`) for easy inspection
- Coach chatbot degrades to structured list when LLM is unavailable — never crashes
- **Run seed once**: `cd backend && python seed/seed_memories.py`
- Patterns API uses SQLite JSON1 `json_each` for zero-overhead pattern aggregation
