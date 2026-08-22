# Progress — Role 1 (Backend + Extension Lead)

Track by checking items off live. If something's blocked, note it under **Blockers** immediately rather than sitting on it.

## Hour 0:00 – 0:30 — Joint
- [ ] Schema locked with Role 2 (`experiences`, `recall_events`, `sessions`)
- [ ] API contract locked with Role 2 + Role 3 (`05_BUILD_PLAN.md`)
- [ ] Repo skeleton pushed (backend + extension folders exist, both build/run empty)

## Hour 0:30 – 3:00 — Backend pieces
- [ ] FastAPI app boots locally, SQLite file created, tables exist per locked schema
- [ ] `POST /session/extract` — accepts `{events: [...]}` or `{raw_text: "..."}`
- [ ] Extraction: LLM path wired (Gemini) — produces all required fields (problem, context, reasoning, failures, success, learning)
- [ ] Extraction: regex/deterministic fallback works with LLM disabled (test this explicitly, don't assume)
- [ ] `POST /llm/ask` — `with_memory` / `without_memory` modes both return a response
- [ ] Manual smoke test: paste a fake session → get back a structured experience → visible in DB

## Hour 0:30 – 3:00 — Extension pieces (parallel track)
- [ ] Extension scaffold activates, shows in sidebar, capture toggle command works
- [ ] `terminal.ts` — captures command text, exit code, output via Shell Integration API
- [ ] Test-runner pattern match (pytest/npm test/jest/etc.) tags events as `test_run` with pass/fail
- [ ] `diagnostics.ts` — captures compiler/lint errors via `onDidChangeDiagnostics`, debounced
- [ ] `fileSaves.ts` — captures file path/language/timestamp on save
- [ ] `buffer.ts` — ring buffer holds all 3 event types, capped, per-workspace
- [ ] Trigger logic: fail→pass test pattern fires extraction automatically
- [ ] Trigger logic: idle timeout fires extraction
- [ ] Trigger logic: manual "Extract Now" command works
- [ ] Sidebar webview shell built: search box, manual entry form, paste/import box, Ask/Reprocess chat box (can call mocked responses first)

## Hour 3:00 – 4:15 — Wire to real backend
- [ ] Sidebar search → real `/experiences` (Role 2's endpoint, swap from mock)
- [ ] Sidebar manual entry → real `POST /experiences`
- [ ] Sidebar paste/import → real `/session/extract`
- [ ] Sidebar Ask/Reprocess chat box → real `/llm/ask`, shows with/without-memory responses
- [ ] Full loop tested once: live terminal fail→pass → extraction → experience appears → new similar problem → retrieval → report → Ask with Memory shows different answer

## Hour 4:15 – 4:45 — Package & harden
- [ ] `vsce package` produces a working `.vsix`
- [ ] Fresh install on a clean/second machine (or clean profile) — confirm it activates and captures
- [ ] Fallback confirmed: LLM disabled → extraction still works via regex path
- [ ] Fallback confirmed: shell integration unsupported scenario → paste/import still works

## Hour 4:45 – 5:00 — Demo rehearsal
- [ ] Ran through extension-side steps of `06_DEMO_SCRIPT.md` at least once, on time

## Blockers (update live)
-

## Notes / decisions made during build
-
