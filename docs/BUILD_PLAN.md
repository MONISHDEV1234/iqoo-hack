# MistakeMemo — 5-Hour Build Plan

Team: 2 people + AI coding agents.

**Rule: the first 30 minutes are spent locking the schema and API contract below — together, out loud. Do not deviate from it once locked; changing it mid-build is what causes integration failure at hour 4.**

---

## Schema (lock this)

### `experiences`

| field | type |
|---|---|
| id | integer pk |
| scope | text (`project`\|`ai`\|`universal`) |
| title | text |
| problem_summary | text |
| symptoms | json array |
| error_codes | json array |
| context | json object (language, framework[], libraries[], env) |
| category | text (controlled enum) |
| technologies | json array |
| patterns | json array |
| hypotheses | json array |
| attempts | json array (each: hypothesis, action, result, evidence) |
| failed_approaches | json array |
| successful_approach | text |
| root_cause | text |
| solution | text |
| verification | json object (passed, failed) |
| lesson | text |
| recommended_next_action | text |
| confidence | float |
| project | text |
| source | text (`autocapture`\|`manual`\|`import`\|`seed`) |
| embedding | blob (384 float32) |
| created_at | datetime |
| updated_at | datetime |

Plus FTS5 virtual table indexing `problem_summary, symptoms, lesson, patterns`.

### `recall_events`

id, query, experience_id, retrieval_score, feature_breakdown (json), used_in_report (bool), created_at

### `sessions`

id, workspace, source (`live`\|`import`), started_at, ended_at, capture_enabled (bool), extracted_experience_count

---

## API contract (lock this)

```
POST   /session/extract        { events: [...] } or { raw_text: "..." }  → structured experience
GET    /experiences             ?scope=&category=&q=                     → list
GET    /experiences/{id}                                                 → detail
POST   /experiences              (manual entry)                          → created
POST   /retrieve                { problem_text, scope[] }                → ranked experiences + feature breakdown
POST   /report                  { experience_ids[] }                     → MISTAKEMEMO_REPORT text
POST   /llm/ask                 { problem_text, report_text?, mode }     → LLM response (mode: with_memory|without_memory)
POST   /chat                    { message }                              → coach response + cited experience_ids
GET    /chat/patterns                                                     → top recurring patterns (SQL aggregation)
GET    /dashboard/stats                                                   → counts for dashboard
```

Everything the extension needs and everything the web app needs is covered by this list — no surprise endpoints mid-build.

---

## Hour-by-hour

### Hour 0 – 0:30 — Together
- Lock schema + API contract above.
- Agree on seed data shape (use the example experience JSON from `02_CORE_WORKING.md`).
- Split repo skeleton, both push empty scaffolds that build/run.

### Hour 0:30 – 3:00 — Parallel

**Person A — Backend/ML**
- FastAPI skeleton + SQLite + FTS5 setup
- `seed_memories.py`: 15-20 realistic experiences across 4-5 categories + 3-4 "universal" curated patterns
- `/session/extract` (LLM path + regex fallback)
- MiniLM embedding wrapper + `/retrieve` (weighted formula, feature breakdown returned)
- `/report` deterministic template
- `/llm/ask` (Gemini provider, with/without memory modes)
- `/chat` + `/chat/patterns` (coach endpoint + SQL aggregation)

**Person B — Extension/Frontend**
- Extension scaffold: activation, capture toggle command
- `terminal.ts`, `diagnostics.ts`, `fileSaves.ts` → ring buffer (`buffer.ts`)
- Trigger logic (fail→pass, idle timeout, manual)
- Sidebar webview shell: search box, manual entry form, Ask/Reprocess chat box, paste/import box
- React app scaffold + routing for 5 views (empty states OK for now)

### Hour 3:00 – 4:15 — Parallel, integration-aware
- Person A: wire retrieval inspector data, dashboard stats, recall_events logging
- Person B: wire extension webview → real backend calls; wire React views → real backend calls (Explorer, Session Extraction before/after, Retrieval+Report+Before/After, Coach + patterns panel)
- Both: test the full loop once, end to end, with seed data + one live paste-session extraction

### Hour 4:15 – 4:45 — Joint integration pass
- Package `.vsix`, install fresh, smoke-test on a clean/second machine if possible
- Fix whatever breaks — no new features from this point on

### Hour 4:45 – 5:00 — Demo rehearsal
- Run `06_DEMO_SCRIPT.md` once, end to end, on time
