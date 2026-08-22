# MistakeMemo — Hackathon Build Handoff (v2, redesigned for 5 hours / 2 people)

Read in order:

1. `01_ARCHITECTURE.md` — what we're actually building and why
2. `02_CORE_WORKING.md` — exact capture → extract → retrieve → report pipeline
3. `03_FEATURES.md` — P0 / P1 / P2, and the explicit cut list
4. `04_TECH_STACK.md` — stack, repo layout, dependencies
5. `05_BUILD_PLAN.md` — hour-by-hour split, API contract, schema (lock this first)
6. `06_DEMO_SCRIPT.md` — the exact demo to protect

## What changed from v1

This is a **redesign**, not the original plan. Three scope decisions were made deliberately to fit 5 hours with 2 people + AI coding agents:

- **Autocapture is real, but scoped to 3 stable VS Code APIs**: terminal shell integration, diagnostics, file saves. We are *not* building a chat participant or hooking into Copilot internals — there's no public API for that, and it's a time sink with no payoff. "Ask AI with Memory" is our own simple chat box in the extension sidebar, calling our own backend.
- **No trained ranking model.** Relevance scoring is MiniLM cosine similarity + a weighted formula over metadata matches (error code, framework, pattern, language). Still real ML (real embeddings, real similarity math) — just no training pipeline, which was the single biggest time-and-failure risk in v1.
- **The `MISTAKEMEMO_REPORT` is a deterministic template**, not LLM-generated. Faster, and it always works even if the LLM API is down — which matches the project's own reliability principle.

## What's new in this version

- **Autocapture (real):** terminal commands + exit codes + output, diagnostics (compiler/lint errors), file saves — all via documented VS Code APIs, buffered per-session, with a fail→pass test pattern as the primary extraction trigger.
- **Coach chatbot (new):** a web app tab where the user asks things like "what do I keep messing up with FastAPI?" and gets an answer grounded only in their own stored experiences, plus a "recurring patterns" panel (pure SQL aggregation, no new ML needed).

## Non-negotiable principle

Protect this loop above all individual features:

```
CAPTURE → EXTRACT → STORE → RETRIEVE → REPORT → AI → OUTCOME → NEW EXPERIENCE
```

If this works end-to-end on a clean laptop, the project succeeds. Everything else is polish.

## Team

2 people + AI coding agents, ~5 hours.

- **Person A — Backend / ML / Data:** FastAPI core, SQLite schema, seed data, extraction, retrieval scoring, report builder, chatbot endpoint.
- **Person B — Extension / Frontend:** VS Code extension (3 capture listeners + sidebar webview + VSIX), React web app (5 views).

Lock the schema and API contract (`05_BUILD_PLAN.md`) in the **first 30 minutes**. Everything after that runs in parallel against that contract — do not let backend and frontend/extension serialize on each other.

## Reliability rules (do not violate under demo pressure)

- If the LLM API is down or slow: extraction falls back to a deterministic parser (regex over test output + diagnostics), retrieval and report generation are unaffected (they never depended on the LLM anyway).
- If terminal shell integration isn't available in a given shell: the "Paste/Import Session" flow is the fallback — build it as a first-class feature, not an afterthought, since it's also your safest live-demo trigger.
- If nothing relevant is retrieved: the system says so. Never force a low-confidence memory into a report.
