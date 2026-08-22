# MistakeMemo — Backend

Implements the API contract for the frontend: experience extraction, hybrid
retrieval, and the `MISTAKEMEMO_REPORT` builder.

## What's simplified vs. the full architecture doc (on purpose, for 3 hours)

- **No SQLite/FTS5** — experiences are stored as plain JSON in
  `data/experiences.json`. Same data shape either way; swapping in real
  SQLite later is a storage-layer change only, nothing else moves.
- **No local MiniLM** — uses Gemini's embedding API instead. Same "semantic
  vector retrieval" story, zero local ML setup.
- **No trained relevance ranker** — retrieval is semantic cosine similarity
  blended with lexical/technology keyword overlap (`hybridScore()` in
  `server.js`). This is a legitimate hybrid-retrieval approach, just without
  a separately trained model behind it.
- **No VS Code extension** — out of scope for today entirely.

## Setup

```
cp .env.example .env
# paste your Gemini key into GEMINI_API_KEY= in .env
npm install
npm start
```

Server runs on **http://localhost:3001**. Your frontend calls this directly
(CORS is open by default via `ALLOWED_ORIGINS=*` in `.env` — tighten later
if you want).

Before demoing, call `POST /api/seed-demo` once (no body needed) so
`/api/retrieve` has something real to match against on the very first try.

## API contract

### `POST /api/ingest`
Extracts a structured experience from a raw debugging session.

```json
// request
{ "rawText": "TypeError: Cannot read properties of undefined (reading 'map') ... tried X, then Y, finally fixed by Z" }

// response
{
  "id": "uuid",
  "scope": "project",
  "problem_summary": "...",
  "symptoms": ["..."],
  "technologies": ["..."],
  "patterns": ["..."],
  "failed_approaches": ["..."],
  "successful_approach": "...",
  "root_cause": "...",
  "solution": "...",
  "lesson": "...",
  "confidence": "low | medium | high",
  "source": "manual-ingest",
  "createdAt": "ISO timestamp"
}
```

### `POST /api/retrieve`
Hybrid semantic + lexical search over stored experiences. Results below a
0.35 similarity score are filtered out — this is the "confidence threshold"
so irrelevant memories don't get surfaced.

```json
// request
{ "queryText": "app crashes with cannot read properties of undefined filter" }

// response
{
  "matches": [
    {
      "id": "uuid",
      "problem_summary": "...",
      "similarity": 0.87,
      "semanticSim": 0.91,
      "solution": "...",
      "lesson": "...",
      "...": "rest of the experience fields"
    }
  ]
}
```

### `POST /api/report`
Synthesizes matched experiences + the new problem into a compact report.
Pass the `id`s from `/api/retrieve`'s `matches` as `matchIds`.

```json
// request
{ "queryText": "...", "matchIds": ["uuid1", "uuid2"] }

// response
{ "report": "plain text MISTAKEMEMO_REPORT, ~150 words" }
```

If `matchIds` is empty, this returns a graceful "no prior experience found"
message without calling the model — use this to show the UI's empty state.

### `GET /api/experiences`
Returns every stored experience (embeddings stripped), newest first.

### `DELETE /api/experiences/:id`
Deletes one experience. Returns `{ "deleted": 0 or 1 }`.

### `GET /api/health`
`{ "ok": true, "hasApiKey": true/false, "model": "...", "embedModel": "..." }`
— useful for a status dot in the UI.

### `POST /api/seed-demo`
No body. Loads two realistic pre-embedded experiences so the demo never
starts from an empty store.

## Quick manual test (no frontend needed)

```
curl -X POST http://localhost:3001/api/seed-demo

curl -X POST http://localhost:3001/api/retrieve \
  -H "Content-Type: application/json" \
  -d '{"queryText": "getting undefined error when mapping over users array"}'

# copy an id from the matches array above, then:
curl -X POST http://localhost:3001/api/report \
  -H "Content-Type: application/json" \
  -d '{"queryText": "getting undefined error when mapping over users array", "matchIds": ["PASTE_ID_HERE"]}'
```

## Demo flow to build the UI around

1. Paste a debugging session into an "ingest" box → show the extracted
   experience (problem/symptoms/failed approaches/solution/lesson).
2. Paste a second, related-but-differently-worded problem → call
   `/api/retrieve` → show matches with similarity scores.
3. Call `/api/report` with those match ids → show the generated
   `MISTAKEMEMO_REPORT` as the hero output. This is the single most
   demo-able artifact — the report is the whole point of the system.
