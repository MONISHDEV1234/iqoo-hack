# Progress — Role 1 (Backend + Extension Lead)

Track by checking items off live. If something's blocked, note it under **Blockers** immediately rather than sitting on it.

## Hour 0:00 – 0:30 — Joint
- [x] Schema locked with Role 2 (`experiences`, `recall_events`, `sessions`) — locked in BUILD_PLAN.md
- [x] API contract locked with Role 2 + Role 3 (`BUILD_PLAN.md`) — stubs live in main.py
- [x] Repo skeleton pushed (backend + extension folders exist, both build/run empty)

## Hour 0:30 – 3:00 — Backend pieces
- [x] FastAPI app boots locally, SQLite file created, tables exist per locked schema (`backend/main.py`, `backend/db.py`)
- [x] `POST /session/extract` — accepts `{events: [...]}` or `{raw_text: "..."}` (`backend/main.py`)
- [x] Extraction: LLM path wired (Gemini) — produces all required fields (`backend/extraction/llm_extract.py`)
- [x] Extraction: regex/deterministic fallback works with LLM disabled (`backend/extraction/fallback_extract.py`)
- [x] `POST /llm/ask` — `with_memory` / `without_memory` modes both return a response (`backend/main.py`)
- [ ] Manual smoke test: paste a fake session → get back a structured experience → visible in DB ← **do this now**

## Hour 0:30 – 3:00 — Extension pieces (parallel track)
- [x] Extension scaffold activates, shows in sidebar, capture toggle command works (`extension/src/extension.ts`)
- [x] `terminal.ts` — captures command text, exit code, output via Shell Integration API
- [x] Test-runner pattern match (pytest/npm test/jest/etc.) tags events as `test_run` with pass/fail
- [x] `diagnostics.ts` — captures compiler/lint errors via `onDidChangeDiagnostics`, debounced
- [x] `fileSaves.ts` — captures file path/language/timestamp on save
- [x] `buffer.ts` — ring buffer holds all 3 event types, capped at 500, per-workspace
- [x] Trigger logic: fail→pass test pattern fires extraction automatically (`buffer.ts`)
- [x] Trigger logic: idle timeout fires extraction (10 min, `buffer.ts`)
- [x] Trigger logic: manual "Extract Now" command works (`extension/src/extension.ts`)
- [x] Sidebar webview shell built: paste/import box, search box, Ask/Reprocess chat, toggle (`sidebar/SidebarProvider.ts`)

## Hour 3:00 – 4:15 — Wire to real backend
- [ ] Sidebar search → real `/experiences` (swap from mock when Role 2 ships retrieval)
- [ ] Sidebar manual entry → real `POST /experiences`
- [ ] Sidebar paste/import → real `/session/extract` ← already wired via `ApiClient`
- [ ] Sidebar Ask/Reprocess chat box → real `/llm/ask` ← already wired via `ApiClient`
- [ ] Full loop tested once: live terminal fail→pass → extraction → experience appears → new similar problem → retrieval → report → Ask with Memory shows different answer

## Hour 4:15 – 4:45 — Package & harden
- [ ] `vsce package` produces a working `.vsix`
- [ ] Fresh install on a clean/second machine (or clean profile) — confirm it activates and captures
- [ ] Fallback confirmed: LLM disabled → extraction still works via regex path
- [ ] Fallback confirmed: shell integration unsupported scenario → paste/import still works

## Hour 4:45 – 5:00 — Demo rehearsal
- [ ] Ran through extension-side steps of `DEMO_SCRIPT.md` at least once, on time

## Blockers (update live)
- None yet

## Notes / decisions made during build
- Backend uses stdlib `urllib` for Gemini calls — no extra runtime deps beyond FastAPI + uvicorn
- Role 2 endpoint stubs (`/retrieve`, `/report`, `/chat`, `/chat/patterns`) live in `backend/main.py` already — Role 3 and extension can hit them immediately (returns empty/stub)
- `GET /experiences` and `POST /experiences` are also fully wired (no Role 2 needed for basic list/create)
- Extension `backendUrl` is configurable via VS Code settings (`mistakememo.backendUrl`, default `http://localhost:8000`)
- Sidebar paste/import and Ask LLM are already wired to real endpoints via `ApiClient`
