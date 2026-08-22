# Progress — Role 3 (Frontend / Web App)

Track by checking items off live. If something's blocked, note it under **Blockers** immediately rather than sitting on it.

## Hour 0:00 – 0:30 — Joint
- [ ] API contract locked with Role 1 + Role 2 (`05_BUILD_PLAN.md`) — this is what you'll mock against
- [ ] React + Vite + TS + Tailwind scaffold pushed, builds and runs

## Hour 0:30 – 3:00 — Build against mocks
- [ ] Routing set up for 5 views: Dashboard, Explorer+Detail, Session Extraction, Retrieval+Report+Before/After, Coach
- [ ] Mock data/handlers written matching the locked API contract exactly (so swapping to live calls later is a one-line change, not a rewrite)
- [ ] **Dashboard** — memory count, experiences learned, recalls, session status (mocked)
- [ ] **Experience Explorer** — search/filter list view (mocked)
- [ ] **Experience Detail** — problem, symptoms, context, approaches, failures, successes, root cause, solution, lesson, patterns, verification (mocked)
- [ ] **Session Extraction view** — raw event count → extraction → structured experience(s), the "187 → 3" reduction visual (mocked)
- [ ] **Retrieval Inspector** — query, candidates, per-feature score breakdown, selected/ranked memories (mocked)
- [ ] **Report Inspector** — shows the exact `MISTAKEMEMO_REPORT` text (mocked)
- [ ] **AI Before/After panel** — without-memory vs with-memory response shown side by side (mocked)
- [ ] **Coach Chatbot** — chat UI, message list, input box (mocked responses, must show cited experience IDs)
- [ ] **Recurring Patterns panel** — top 3 patterns by frequency, next to the chatbot (mocked)
- [ ] Project / AI / Universal scope toggle wired into Explorer + Coach (mocked data reacts to toggle)

## Hour 3:00 – 4:15 — Swap to live
- [ ] Dashboard → real `GET /dashboard/stats`
- [ ] Explorer + Detail → real `GET /experiences`, `GET /experiences/{id}`
- [ ] Session Extraction view → real `POST /session/extract` (paste-session path)
- [ ] Retrieval Inspector → real `POST /retrieve`
- [ ] Report Inspector → real `POST /report`
- [ ] AI Before/After → real `POST /llm/ask` (both modes)
- [ ] Coach Chatbot → real `POST /chat`
- [ ] Recurring Patterns panel → real `GET /chat/patterns`
- [ ] Recall history view (if time) → real `recall_events` data via Role 2

## Hour 4:15 – 4:45 — Harden
- [ ] Loading states for every view that calls the backend (never a blank/broken screen mid-demo)
- [ ] Graceful "no relevant experience found" state — must look intentional, not like an error
- [ ] Graceful "LLM unavailable" state on Coach + Before/After panel
- [ ] Visual pass: is the "187 → 3" reduction and the Before/After AI comparison as visually clear and punchy as possible? These are the two demo money-shots — polish these two views hardest if time is short.

## Hour 4:45 – 5:00 — Demo rehearsal
- [ ] Ran through the web-app-side steps of `06_DEMO_SCRIPT.md` at least once, on time, on the actual demo machine

## Blockers (update live)
-

## Notes / decisions made during build
-
