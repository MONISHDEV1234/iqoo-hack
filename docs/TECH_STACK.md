# MistakeMemo — Tech Stack (v2)

## Philosophy

Smallest stack that reliably implements the closed loop. No microservices, no external infra beyond one optional LLM API.

## Frontend / web app

- React + Vite + TypeScript
- Tailwind CSS
- Served locally via the backend, or built static for a showcase URL

## VS Code extension

- TypeScript, VS Code Extension API
- **Terminal Shell Integration API** (`window.onDidStartTerminalShellExecution`, `onDidEndTerminalShellExecution`)
- **Diagnostics API** (`languages.onDidChangeDiagnostics`, `languages.getDiagnostics`)
- **Workspace events** (`workspace.onDidSaveTextDocument`)
- Webview for sidebar UI (own chat box, search, manual entry — no chat participant API)
- VSIX packaging (`vsce package`)
- Standard desktop APIs only — no proprietary internals — so it's demoable in other VS Code-based IDEs too

## Backend / local core

- Python + FastAPI
- SQLite + FTS5 (JSON1 for structured fields)
- One local process; extension and web app both talk to it over `localhost`

Avoid: PostgreSQL, Redis, Kafka, Kubernetes, multiple services, separate vector DB.

## Database

SQLite. Target ≤10,000 experiences. Embeddings stored as BLOB (384-dim, float32). FTS5 virtual table for lexical candidates; cosine similarity computed in Python at this scale — no vector DB needed.

## Embeddings

`sentence-transformers/all-MiniLM-L12-v2`, used directly via `sentence-transformers` (Python). 384-dim output. ONNX only if it's a zero-friction swap — never a blocker; don't spend time on it.

## Relevance scoring

Weighted formula over semantic similarity + metadata match features (see `02_CORE_WORKING.md` §6). **No training pipeline, no BugHub sourcing, no trained model file for this hackathon.** This is the single biggest change from v1 and the reason the timeline works.

## LLM

One provider, abstracted behind a simple interface:

```
LLMProvider
  └── GeminiProvider
```

Used for: session extraction, manual-entry structuring, "Ask/Reprocess with Memory" responses, Coach chatbot responses. Never used for: retrieval, ranking, or report construction — those are deterministic and must work with the LLM fully offline/unavailable.

## Local/offline behavior

Must work offline: memory creation/storage, FTS5 search, embeddings (if model is cached locally), formula-based ranking, structured memory display, deterministic report generation. Online LLM is optional and every call site has a graceful fallback (regex extraction, or "LLM unavailable" message with structured data still shown).

## Suggested repository layout

```
mistakememo/
├── backend/
│   ├── main.py
│   ├── db.py                  # SQLite + FTS5 setup
│   ├── schemas.py              # pydantic models
│   ├── extraction/
│   │   ├── llm_extract.py
│   │   └── fallback_extract.py # regex/deterministic path
│   ├── retrieval/
│   │   ├── embeddings.py       # MiniLM wrapper
│   │   └── scoring.py          # weighted formula
│   ├── reporting/
│   │   └── report_builder.py   # deterministic template
│   ├── chat/
│   │   └── coach.py            # coach chatbot + pattern aggregation
│   └── llm/
│       ├── base.py
│       └── gemini_provider.py
│
├── web/
│   └── src/
│       ├── pages/               # Dashboard, Explorer, Session, Retrieval, Coach
│       └── components/
│
├── extension/
│   ├── package.json
│   ├── src/
│   │   ├── capture/
│   │   │   ├── terminal.ts
│   │   │   ├── diagnostics.ts
│   │   │   └── fileSaves.ts
│   │   ├── buffer.ts            # ring buffer + trigger logic
│   │   ├── sidebar/              # webview UI
│   │   └── commands.ts
│   └── media/
│
├── demo/
│   └── seed_memories.py         # ~15-20 seeded experiences + 3-4 universal patterns
│
└── README.md
```
