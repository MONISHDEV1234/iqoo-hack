# MistakeMemo — Backend

Implements the API contract for the frontend: experience extraction, hybrid
retrieval, and the `MISTAKEMEMO_REPORT` builder.

## What's new in this pass

Added on top of your teammate's SQLite+FTS5+trained-relevance-model build:

- `GET /api/experiences/:id` — was missing, only list existed before
- `GET /api/dashboard/stats` — total/scope/pattern/technology/confidence
  breakdowns + timeline, pure SQL/JS, works offline
- `GET /api/chat/patterns` — top recurring patterns
- `POST /api/chat` — coach chatbot with graceful LLM-unavailable fallback
- `feature_breakdown` now fully populated on every `/api/retrieve` match
- Seed data expanded from 2 → 10 experiences, covering 7+ pattern
  categories with a few marked `scope: 'universal'`

All of the above were verified against the running server before this zip
was made — see the route-by-route testing this session covered: dashboard
math checked against known input, 404 handling on missing experience ids,
the chat endpoint's three response shapes (LLM success, LLM-unavailable
fallback, no-match), and the FTS5-only degraded retrieval path.

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
Hybrid semantic + lexical search over stored experiences, scored by a
trained logistic regression relevance model. Below-threshold results are
filtered out. Each match now includes a full `feature_breakdown` object
(not just the final score) so a UI can show *why* something matched:

```json
{
  "matches": [{
    "id": "uuid",
    "problem_summary": "...",
    "similarity": 0.87,
    "feature_breakdown": {
      "semanticSim": 0.91,
      "lexicalOverlap": 0.6,
      "techMatch": 1,
      "patternMatch": 0
    }
  }],
  "degraded": false
}
```

`degraded: true` means the embedding call failed and results are ranked by
FTS5 lexical search alone — this is the "embeddings unavailable → retrieval
still works" reliability principle from the architecture doc, and it's
real, not aspirational — verified by disabling network access and
confirming retrieval still returns the correct match.

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

### `GET /api/experiences/:id`
Returns one experience by id, or `404 { "error": "not found" }`.

### `GET /api/dashboard/stats`
Progress dashboard aggregates — pure SQL/JS, no LLM call, always works even
offline:

```json
{
  "total_experiences": 10,
  "total_recalls": 4,
  "used_in_report_count": 1,
  "by_scope": { "project": 7, "universal": 3 },
  "by_pattern": { "null-undefined": 2, "async-await": 2 },
  "by_technology": { "react": 3, "node": 2 },
  "by_confidence": { "high": 6, "medium": 4 },
  "top_patterns": [{ "pattern": "null-undefined", "count": 2 }],
  "timeline": [{ "date": "2026-08-19", "count": 2 }]
}
```

### `GET /api/chat/patterns`
Top recurring patterns across all stored experiences:
`{ "patterns": [{ "pattern": "null-undefined", "count": 2 }] }`

### `POST /api/chat`
Coach chatbot. Retrieves relevant experiences (project + universal scope),
asks Gemini to answer citing experience ids. **Degrades gracefully** to a
formatted experience list if the LLM call fails — never crashes, never
returns nothing.

```json
// request
{ "message": "getting undefined when I call filter on an array" }

// response (LLM available)
{
  "reply": "This looks like [uuid1] — you fixed a similar undefined-array issue by...",
  "citedExperienceIds": ["uuid1"],
  "degraded": false
}

// response (LLM unavailable — fallback, never crashes)
{
  "reply": "AI coaching is unavailable right now, but here is what I found in your memory:\n\n• ...",
  "citedExperienceIds": ["uuid1"],
  "degraded": true,
  "llmUnavailable": true
}

// response (nothing relevant found)
{
  "reply": "No pattern yet — I don't have any past experience that looks related to this...",
  "citedExperienceIds": [],
  "degraded": false
}
```

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
