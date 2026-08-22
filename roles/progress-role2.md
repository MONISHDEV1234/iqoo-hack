# Progress — Role 2 (Backend / ML / Retrieval)

Track by checking items off live. If something's blocked, note it under **Blockers** immediately rather than sitting on it.

## Hour 0:00 – 0:30 — Joint
- [ ] Schema locked with Role 1 (`experiences`, `recall_events`, `sessions`)
- [ ] API contract locked with Role 1 + Role 3 (`05_BUILD_PLAN.md`)
- [ ] Agreed on seed-data shape (matches the example experience JSON in `02_CORE_WORKING.md`)

## Hour 0:30 – 3:00
- [ ] `db.py` — SQLite + FTS5 virtual table set up per locked schema, JSON1 for structured fields
- [ ] `seed_memories.py` — 15–20 realistic experiences written/generated, spanning 4–5 categories
- [ ] Seed data includes 3–4 curated "universal" scope experiences (for the Universal-scope demo beat)
- [ ] Seed script runs cleanly, populates DB, embeddings generated for every seeded experience
- [ ] MiniLM embedding wrapper (`sentence-transformers/all-MiniLM-L12-v2`) — takes text, returns 384-dim vector, stores/reads as BLOB
- [ ] `POST /retrieve` — FTS5 candidate pull + weighted formula (semantic, error_match, framework_match, language_match, pattern_overlap, symptom_overlap)
- [ ] `/retrieve` returns per-candidate feature breakdown, not just final score (needed for Retrieval Inspector view)
- [ ] Confidence threshold implemented — returns "no sufficiently relevant experience" when nothing clears it
- [ ] `POST /report` — deterministic template, builds from top 1–3 ranked experiences
- [ ] `GET /experiences` (list, filterable by scope/category/query) + `GET /experiences/{id}` (detail)
- [ ] `POST /experiences` (manual entry, LLM-assisted structuring of free text)

## Hour 3:00 – 4:15
- [ ] `POST /chat` — Coach chatbot: retrieval (project+ai scope, looser threshold) + LLM coaching prompt, must cite experience IDs, must say "no pattern yet" when nothing relevant
- [ ] `GET /chat/patterns` — pure SQL aggregation (GROUP BY pattern/category, COUNT, ORDER BY count DESC), top 3
- [ ] `GET /dashboard/stats` — memory count, experiences learned, recalls, session status
- [ ] `recall_events` logged on every `/retrieve` call (query, experience_id, score, feature breakdown, used_in_report)
- [ ] Retrieval formula weights sanity-checked against seed data — do obviously-similar problems actually score high?

## Hour 4:15 – 4:45 — Harden
- [ ] Fallback confirmed: LLM disabled → `/chat` degrades gracefully (pattern panel still works, chat says LLM unavailable)
- [ ] Fallback confirmed: `/retrieve` and `/report` never call the LLM, verified by disabling LLM key entirely and re-testing
- [ ] Load a slightly messy/edge-case pasted session through the full pipeline once, confirm no crashes

## Hour 4:45 – 5:00 — Demo rehearsal
- [ ] Ran through backend-side data (seed data, retrieval scores, report output, chat answers) matches what's planned for `06_DEMO_SCRIPT.md`

## Blockers (update live)
-

## Notes / decisions made during build
-
