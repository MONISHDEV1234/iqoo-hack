# MistakeMemo — Team Roles (3 people)

## Role 1 — Backend + Extension Lead

Owns everything the VS Code extension needs to work end to end, including the two backend endpoints that are tightly coupled to capture/AI-interaction.

**Backend pieces owned:**
- Initial FastAPI + SQLite scaffold (stood up in the first 30 min, shared with Role 2 immediately)
- `POST /session/extract` — LLM-assisted extraction + regex/deterministic fallback
- `POST /llm/ask` — Ask/Reprocess with Memory (with_memory / without_memory modes)

**Extension pieces owned (all of it):**
- Capture: `terminal.ts` (Shell Integration API), `diagnostics.ts`, `fileSaves.ts`
- Ring buffer + trigger logic (fail→pass pattern, idle timeout, manual)
- Sidebar webview: search box, manual entry form, paste/import box, Ask/Reprocess chat box
- Capture on/off toggle, project/workspace awareness
- VSIX packaging, clean-install smoke test

**Why paired this way:** extraction and Ask/Reprocess are the two backend calls the extension fires directly and iterates against constantly — keeping them with the same person as the extension avoids a cross-person round trip every time the extension's needs change.

## Role 2 — Backend / ML / Retrieval

Owns memory, ranking, reporting, and the Coach chatbot — the "brain" of the system, consumed by both Role 1's extension and Role 3's web app but not tightly coupled to either's UI iteration speed.

- `db.py` — SQLite + FTS5 schema setup (from the locked schema)
- `seed_memories.py` — 15–20 realistic experiences + 3–4 curated "universal" patterns
- MiniLM embedding wrapper
- `POST /retrieve` — weighted formula scoring + feature breakdown
- `POST /report` — deterministic `MISTAKEMEMO_REPORT` template
- `GET/POST /experiences` — list, detail, manual create
- `POST /chat` + `GET /chat/patterns` — Coach chatbot + pattern aggregation
- `GET /dashboard/stats`
- `recall_events` logging on every retrieval

## Role 3 — Frontend (web app)

Owns the entire "mother ship" web app — pure consumer of Role 1 and Role 2's endpoints, no backend code.

- React + Vite + TS + Tailwind scaffold, routing for 5 views
- Dashboard
- Experience Explorer + Detail
- Session Extraction view (before/after event reduction — the wow moment)
- Retrieval + Report + AI Before/After comparison view
- Coach Chatbot + recurring-patterns panel

Should build against **mocked responses matching the locked API contract** for the first stretch, then swap to live calls once Role 1/2 endpoints are up — this is what lets all three tracks run fully in parallel from minute 30.

## Dependency map (who blocks whom, and how to avoid it)

- Role 3 depends on Role 1 + Role 2's endpoints matching the locked contract exactly → mitigated by building against mocks first.
- Role 1's extension depends on Role 1's own `/session/extract` and `/llm/ask` → no cross-person dependency, by design.
- Role 1's sidebar "search" and "manual entry" call Role 2's `/experiences` and `/retrieve` → Role 1 can mock these too until Role 2 ships them, same pattern as Role 3.
- Nobody should be blocked past the first 30 minutes if the contract in `05_BUILD_PLAN.md` is respected exactly.

## Integration checkpoints (all three, together)

- **Hour 2:00** — quick sync: is everyone's actual API shape still matching the locked contract? Fix drift now, not at hour 4.
- **Hour 3:30** — first full live wire-through: extension → real backend, web app → real backend, no mocks.
- **Hour 4:15** — joint integration pass, VSIX install test, fix-only (no new features).
- **Hour 4:45** — demo rehearsal, full team.
