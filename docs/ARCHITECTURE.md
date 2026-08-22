# MistakeMemo — Architecture (v2)

## Product identity

MistakeMemo is a local-first experience-learning layer for AI-assisted debugging.

Core promise: observe permitted debugging activity → extract only the meaningful problem-solving experience (especially failed approaches and failed tests) → store it structured → retrieve relevant prior experiences for a new problem → hand an existing LLM a compact `MISTAKEMEMO_REPORT` so its next attempt is better informed.

It is not a chat archive and not generic RAG-over-transcripts.

## High-level flow

```
                    VS CODE WORKSPACE
        +-----------+-----------+-----------+
        |           |           |
   Terminal    Diagnostics   File saves
   Shell Integ. (compiler/    (onDidSave)
   (commands,    lint errors)
   output,
   exit codes)
        |           |           |
        +-----------+-----------+
                    |
                    v
        SESSION RING BUFFER (in-memory, per workspace)
                    |
        trigger: fail→pass test pattern
                 OR idle timeout
                 OR manual "Extract Now"
                 OR paste/import session
                    |
                    v
        POST /session/extract  (FastAPI local core)
                    |
                    v
        EXTRACTION (LLM-assisted, evidence-grounded;
                     regex fallback if LLM unavailable)
                    |
                    v
        STRUCTURED EXPERIENCE  →  SQLite (experiences + FTS5 + embedding BLOB)
                    |
              [ NEW PROBLEM occurs later ]
                    |
                    v
        HYBRID RETRIEVAL
        FTS5 lexical candidates
              +
        MiniLM-L12-v2 cosine similarity
              +
        metadata match features (error/framework/pattern/lang)
              +
        weighted scoring formula → ranked experiences
              |
              v
        REPORT BUILDER (deterministic template)
              |
              v
        MISTAKEMEMO_REPORT  →  LLM (via extension sidebar chat, or web app)
              |
              v
        Better next action → tests → outcome → NEW EXPERIENCE
```

## Client surfaces

### Web app ("mother ship")

Demonstration + management surface. 5 views (see `03_FEATURES.md` / `05_BUILD_PLAN.md`):

1. Dashboard
2. Experience Explorer + Detail
3. Session Extraction (paste-session → before/after event reduction)
4. Retrieval + Report + AI Before/After comparison
5. Coach Chatbot ("your recurring mistakes")

Runs locally against the FastAPI core; can also be built static for showcase purposes.

### VS Code extension ("landing ship")

The real, installable integration. Responsibilities:

- **Capture (autocapture, real):**
  - Terminal Shell Integration API (`onDidStartTerminalShellExecution` / `onDidEndTerminalShellExecution`) — command text, exit code, output stream.
  - Diagnostics API (`languages.onDidChangeDiagnostics`) — compiler/lint errors as they appear.
  - Workspace events (`onDidSaveTextDocument`) — files changed.
  - All three write timestamped events into an in-memory ring buffer, capped (e.g. 500 events), per workspace.
- **Trigger extraction** on: a failing test-runner command followed later by a passing one (primary signal), buffer idle timeout, explicit command, or workspace close.
- **Sidebar webview** — thin client over the local backend: manual experience entry, memory search, "Ask AI with Memory" / "Reprocess with Memory" (a simple chat box that calls `/report` then `/llm/ask`), capture on/off toggle, project awareness.
- **No chat participant, no Copilot hooking.** All AI interaction the extension offers is through its own webview UI calling our own backend — fully within our control, fully inspectable, and it's the correct interpretation of "capture only what's exposed to us."

## Local-first core

One local process. No microservices.

```
VS Code Extension  ---localhost--->  FastAPI Core  ---uses--->  SQLite (+FTS5)
Web App            ---localhost/                                MiniLM (local)
                        static--->                               Optional LLM API
```

## Storage

SQLite. Target ≤10,000 experiences. No Postgres, no Redis, no vector DB — cosine similarity over local embedding BLOBs is fine at this scale; FTS5 narrows candidates first.

Tables: `experiences`, `recall_events`, `sessions` (raw buffer is transient, never persisted beyond the extraction it produced, unless "debug/advanced" mode is explicitly on).

## Retrieval architecture (no trained model)

```
new problem
   |
signal extraction (symptoms, error codes, tech, framework, patterns)
   |
FTS5 lexical candidates  ------\
                                 >--- combine
MiniLM cosine similarity  ------/
   |
weighted formula: semantic + error_match + framework_match
                 + language_match + pattern_overlap + symptom_overlap
   |
confidence threshold  →  ranked experiences (or "no sufficiently relevant experience")
```

This is intentionally a formula, not a trained classifier — it is fast to implement, fully explainable in the demo ("here's exactly why this scored 91%"), and removes the biggest training-pipeline risk from v1. A trained Logistic Regression ranker is a valid post-hackathon upgrade, not a requirement.

## LLM role

Used for:
- experience extraction from a session (with a deterministic regex-based fallback if unavailable)
- manual-entry structuring assistance
- the actual "next attempt" reasoning when the extension/web app sends the report to it
- Coach chatbot responses (grounded in retrieved experiences + pattern aggregation, never freeform)

Never used for: retrieval, ranking, or report construction (both are deterministic/formula-based so they never depend on network/LLM availability).

## Reliability contract

- LLM down → extraction falls back to regex parsing of test/diagnostic output; retrieval, ranking, and report generation are entirely unaffected since none of them call the LLM.
- Shell integration unsupported in a given terminal → paste/import session is the fallback capture path, always available, and also used live in the demo.
- Web app down → extension still fully functions (it never depends on the web app).
- Universal memory (seeded) unavailable → project/AI scopes still work.
