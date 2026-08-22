# Progress — Role 1 (Backend + Extension Lead)

Track by checking items off live. If something's blocked, note it under **Blockers** immediately.

## Hour 0:00 – 0:30 — Joint
- [x] Schema locked with Role 2 (`experiences`, `recall_events`, `sessions`) — locked in BUILD_PLAN.md
- [x] API contract locked with Role 2 + Role 3 (`BUILD_PLAN.md`) — all stubs live in main.py
- [x] Repo skeleton pushed (backend + extension folders exist, both build/run empty)

## Hour 0:30 – 3:00 — Backend pieces
- [x] FastAPI app boots locally, SQLite file created, tables exist per locked schema (`backend/main.py`, `backend/db.py`)
- [x] `POST /session/extract` — accepts `{events: [...]}` or `{raw_text: "..."}` (`backend/main.py`)
- [x] Extraction: LLM path wired (Gemini) — produces all required fields (`backend/extraction/llm_extract.py`)
- [x] Extraction: regex/deterministic fallback works with LLM disabled — **smoke tested, confirmed working** (`backend/extraction/fallback_extract.py`)
- [x] `POST /llm/ask` — `with_memory` / `without_memory` modes both return a response (`backend/main.py`)
- [x] Manual smoke test: paste a fake session → structured experience returned → stored in DB ✅

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
- [x] Sidebar paste/import → real `/session/extract` — wired via `ApiClient` ✅
- [x] Sidebar Ask/Reprocess chat box → real `/llm/ask` — wired via `ApiClient` ✅
- [x] Sidebar search → real `/experiences` — wired via `ApiClient` ✅
- [ ] Full loop tested once: live terminal fail→pass → extraction → experience appears → retrieval → report → Ask with Memory shows different answer ← **do live in demo**

## Hour 4:15 – 4:45 — Package & harden
- [x] `vsce package` produces a working `.vsix` — **`mistakememo-0.1.0.vsix` (28.51 KB, 26 files)** ✅
- [ ] Fresh install on a clean/second machine (or clean profile) — confirm it activates and captures
- [x] Fallback confirmed: LLM disabled → extraction still works via regex path ✅
- [x] Fallback confirmed: paste/import still works (no shell integration needed) ✅

## Hour 4:45 – 5:00 — Demo rehearsal
- [ ] Ran through extension-side steps of `DEMO_SCRIPT.md` at least once, on time

## Blockers (update live)
- None

## Notes / decisions made during build
- Backend uses stdlib `urllib` for Gemini calls — no extra runtime deps beyond FastAPI + uvicorn
- All Role 2 endpoint stubs are live from the start — Role 3 hit them from minute 1 (no 404s)
- `GEMINI_API_KEY` not set → fallback extraction runs automatically, zero crashes
- Extension `backendUrl` configurable via VS Code settings (`mistakememo.backendUrl`, default `http://localhost:8000`)
- VSIX is 28KB — clean and minimal
- **Start backend**: `cd backend && uvicorn main:app --reload` (then run `python seed/seed_memories.py` once)
