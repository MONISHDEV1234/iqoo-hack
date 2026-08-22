# MistakeMemo — Core Working / Data Pipeline (v2)

## 1. Capture (real autocapture, 3 sources)

All three run inside the VS Code extension and write to a single in-memory ring buffer (max ~500 events, per workspace, cleared on extraction).

### a) Terminal — Shell Integration API

```ts
vscode.window.onDidStartTerminalShellExecution(e => {
  // e.execution.commandLine.value -> the command text
})
vscode.window.onDidEndTerminalShellExecution(e => {
  // e.exitCode, and e.execution.read() (async iterable) for output
})
```

Capture: command text, exit code, last N lines of output (cap ~4000 chars to avoid noise).

Classify known test-runner commands via simple pattern match (`pytest`, `npm test`, `yarn test`, `go test`, `jest`, `mvn test`, `cargo test`, etc.) — tag the event as `test_run` with `passed`/`failed` parsed from exit code + output (fallback: exit code alone is enough).

### b) Diagnostics — compiler/lint errors

```ts
vscode.languages.onDidChangeDiagnostics(e => {
  // for each uri in e.uris: vscode.languages.getDiagnostics(uri)
})
```

Capture: file, message, severity, source (e.g. `pyright`, `eslint`), range. Debounce (e.g. 1.5s) — diagnostics fire rapidly while typing.

### c) File saves

```ts
vscode.workspace.onDidSaveTextDocument(doc => {
  // doc.uri, doc.languageId, timestamp
})
```

Capture: file path, language, timestamp. Do not capture full file contents by default (keep it light — this is a signal, not a diff store, unless "advanced/debug capture" is explicitly enabled).

### Event shape (buffer entry)

```json
{
  "ts": 1234567890,
  "type": "terminal | diagnostic | file_save",
  "data": { "...type-specific fields..." }
}
```

## 2. Trigger logic

Extraction fires on the **first** of:

1. **Fail → pass pattern (primary signal):** a `test_run` event with `result: failed`, followed later by a `test_run` event with `result: passed`, in the same buffer. This is the strongest, cheapest signal and matches the demo script directly.
2. **Idle timeout:** buffer has events but nothing new for N minutes (e.g. 10) — session probably over.
3. **Manual trigger:** "Extract Now" command in the sidebar, or workspace closing.
4. **Paste/Import Session:** user pastes a transcript/log directly into the web app or sidebar — bypasses the buffer entirely, goes straight to extraction. This is also the **safe, reliable demo path** if live capture behaves unpredictably on stage.

On trigger: buffer (or pasted text) → `POST /session/extract` → structured experience → buffer cleared.

## 3. Experience extraction

LLM-assisted, evidence-grounded. If the LLM API is unavailable, fall back to a deterministic parser: pull error codes via regex, test pass/fail counts from output, file/language from diagnostics and save events, and construct a minimally-structured experience (fewer fields populated, but it still stores and retrieves).

Required fields — unchanged from the original spec:

**Problem:** summary, symptoms[], error_codes[], severity
**Context:** project, language, framework[], libraries[], environment, files[]
**Reasoning:** hypotheses[], approaches[], observations[], decisions[]
**Failures:** failed_approach, failed_test, evidence, failure_reason
**Success:** successful_approach, root_cause, fix, verification
**Learning:** pattern[], lesson, recommended_next_action, confidence

Ground every claim in evidence where possible (exit codes, test counts, diagnostic messages) — prefer this over unsupported LLM narrative.

## 4. Classification

Controlled category (pick one): `api | database | frontend | backend | networking | authentication | dependency | build | testing | deployment | performance | state_management | type_serialization | environment_config | concurrency | other`

Plus free tags: technologies[], symptoms[], error_codes[], patterns[], failed_strategy_types[], successful_strategy_types[].

## 5. Storage

SQLite. `experiences` table stores structured JSON fields (flattened or as JSON columns — SQLite supports JSON1) + a 384-dim embedding BLOB + FTS5 virtual table over `problem_summary + symptoms + lesson + patterns` for lexical search. Raw buffer/session text is not persisted beyond what extraction needed, unless debug mode is on.

## 6. Retrieval (formula-based, no trained model)

```
new problem text
   |
extract signals: symptoms, error_codes, tech, framework, language, patterns
   |
FTS5 query over experiences  →  candidate set (top ~30)
   |
for each candidate:
   semantic = cosine(MiniLM(new problem), candidate.embedding)          # 0-1
   error_match = 1 if error_codes overlap else 0
   framework_match = jaccard(framework_new, framework_candidate)
   language_match = 1 if language matches else 0
   pattern_overlap = jaccard(patterns_new, patterns_candidate)
   symptom_overlap = jaccard(symptoms_new, symptoms_candidate)

   score = 0.45*semantic + 0.15*error_match + 0.15*framework_match
         + 0.05*language_match + 0.10*pattern_overlap + 0.10*symptom_overlap
   |
sort desc, apply confidence threshold (e.g. score >= 0.55)
   |
return top 3-5, or "no sufficiently relevant experience found"
```

Weights are a starting point — tune once real seed data is in, but keep it simple and explainable; the retrieval inspector view should show each feature's contribution, not just the final score.

## 7. Report builder (deterministic template, no LLM)

```
<MISTAKEMEMO_REPORT>

CURRENT PROBLEM
{current_problem_summary}

RELEVANT EXPERIENCE
Experience #{id}
Relevance: {score}%

SYMPTOMS
{symptoms list}

CONTEXT
{context: framework, language, etc.}

FAILED APPROACH
{failed_approach}
Evidence: {evidence}

SUCCESSFUL APPROACH
{successful_approach}
Root cause: {root_cause}

VERIFICATION
{passed}/{passed+failed} tests passed

REUSABLE PATTERN
{lesson}

RECOMMENDED NEXT ACTION
{recommended_next_action}

IMPORTANT
Prior experience is evidence, not proof. Validate against the current environment.

</MISTAKEMEMO_REPORT>
```

Built with plain string formatting from the top-ranked experience(s) (cap at top 2-3 to keep it compact). Never depends on the LLM, so it's always available even offline.

## 8. AI interaction (no chat participant)

Two entry points, both are just "call the LLM with this text":

- **Ask AI with Memory:** current problem + `MISTAKEMEMO_REPORT` → LLM → response shown in sidebar/web app.
- **Reprocess with Memory:** current problem + prior AI attempt (if captured) + report → LLM → response, shown side-by-side with the "without memory" baseline for the demo's before/after moment.

Both go through our own `/llm/ask` endpoint calling the configured provider (Gemini). No dependency on VS Code's chat UI or Copilot.

## 9. Coach chatbot (new — web app tab)

Purpose: let the user ask about their own recurring mistakes, grounded only in their stored experiences.

```
user question ("what do I keep messing up with FastAPI?")
   |
retrieval (same formula as above, looser threshold, scope = project + ai)
   |
+ pattern aggregation: SQL GROUP BY pattern/category, COUNT, ORDER BY count DESC
   |
LLM prompt: [coaching system prompt] + retrieved experiences + pattern counts + question
   |
response, must cite experience IDs it draws from
   |
if nothing relevant retrieved: "I don't have a pattern for that yet" (never invent one)
```

Alongside the chat: a small "Your Patterns" panel — top 3 recurring categories/patterns by frequency, pure SQL, no LLM or embeddings needed. Cheap, high demo value.

## 10. Important distinction (unchanged)

The system must be able to say "I found no sufficiently relevant prior experience." Never force a low-confidence memory into a report or chatbot answer.
