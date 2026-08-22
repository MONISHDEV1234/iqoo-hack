# MistakeMemo — Features (v2)

## P0 — Must work (the closed loop)

1. VS Code extension installs from `.vsix` on a clean laptop
2. Capture toggle (per workspace)
3. **Autocapture — terminal (shell integration: command, exit code, output)**
4. **Autocapture — diagnostics (compiler/lint errors)**
5. **Autocapture — file saves**
6. Session ring buffer (in-memory, capped, cleared on extraction)
7. Extraction trigger: fail→pass test pattern (primary), idle timeout, manual, paste/import
8. Paste/Import Session flow (also the safe demo fallback)
9. LLM-assisted extraction with regex fallback if LLM unavailable
10. Structured experience storage (SQLite)
11. Classification (controlled category + tags)
12. Failed-approach / failed-test capture as first-class fields
13. Hybrid retrieval: FTS5 + MiniLM cosine similarity + weighted metadata formula
14. Confidence threshold ("no relevant experience found" is a valid, expected output)
15. Deterministic `MISTAKEMEMO_REPORT` builder (no LLM dependency)
16. Ask AI with Memory / Reprocess with Memory (via our own sidebar chat box → `/llm/ask`)
17. Reliable fallback everywhere the LLM or internet is unavailable

## P1 — Must be demonstrable

1. Web app: Dashboard
2. Web app: Experience Explorer + Detail
3. Web app: Session Extraction view (before/after event count — the "187 → 3" moment)
4. Web app: Retrieval + Report + AI Before/After comparison view
5. **Web app: Coach chatbot + recurring-patterns panel (new)**
6. VS Code sidebar webview (search, manual entry, capture toggle, Ask/Reprocess buttons)
7. Manual experience entry (LLM-assisted structuring)
8. Project / AI / Universal scope toggle (Universal = seeded/curated data)
9. Retrieval inspector (show each scoring feature, not just final %)
10. Recall history (which experiences were surfaced, when, used or not)

## P2 — Nice to have, only if time remains

1. Diff capture on file save (currently: path/language/timestamp only)
2. Tuning the retrieval formula weights against seed data
3. Universal-memory summary stats
4. Lightweight analytics on the dashboard
5. Feedback thumbs-up/down on recall events

## Explicitly cut from v1 (do not build these — this is the point of the redesign)

- **Trained relevance/ranking ML model** (Logistic Regression/XGBoost on BugHub pairs) → replaced by weighted formula. Real post-hackathon upgrade, not a requirement now.
- **Chat participant / Copilot integration hooking** → no public API for reading Copilot's internal messages; replaced by our own sidebar chat box calling our own LLM endpoint.
- **"AI is stuck" autonomous detection** → replaced by explicit manual triggers + the fail→pass heuristic, which is cheap and already matches the demo script.
- **Full raw session persistence** → buffer is transient by design; only the extracted experience is permanent.
- **Multi-user cloud sync, federated learning, continual retraining** → future vision, stated as such, never implemented or claimed as implemented.

## Reliability requirements (unchanged, non-negotiable)

Not acceptable under any circumstances:
- extension fails to install
- local memory doesn't persist across restarts
- extraction produces nothing structured
- retrieval doesn't work
- failed tests/approaches are dropped or ignored
- report generation fails silently
- the AI never receives the report
- any core feature requires a fragile cloud service to function
