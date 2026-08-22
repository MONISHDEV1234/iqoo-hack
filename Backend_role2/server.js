require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const db = require('./lib/db');
const { scoreRelevance, isModelLoaded } = require('./lib/relevanceModel');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins
}));
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY || '';
const GEN_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';

const GEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${API_KEY}`;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${API_KEY}`;

// strip heavy/internal fields before sending to the frontend
function clean(exp) {
  const { embedding, ...rest } = exp;
  return rest;
}

// ---------- Gemini helpers ----------
async function geminiGenerate(prompt) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not set on the server (.env)');
  const res = await fetch(GEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) throw new Error(`Gemini generate failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
}

async function geminiEmbed(text) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not set on the server (.env)');
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: `models/${EMBED_MODEL}`, content: { parts: [{ text }] } })
  });
  if (!res.ok) throw new Error(`Gemini embed failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data?.embedding?.values || [];
}

function safeParseJSON(text) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); }
  catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch (e2) {} }
    throw new Error('Could not parse model JSON output: ' + text.slice(0, 200));
  }
}

// ---------- math / scoring ----------
function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]; }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function tokenize(text) {
  return new Set((text || '').toLowerCase().match(/[a-z0-9_.-]+/g) || []);
}

function extractQuerySignals(queryText) {
  const tokens = tokenize(queryText);
  return { tokens };
}

function techMatchFeature(queryTokens, exp) {
  const techTokens = new Set((exp.technologies || []).map(t => t.toLowerCase()));
  for (const t of queryTokens) if (techTokens.has(t)) return 1;
  return 0;
}

function patternMatchFeature(queryTokens, exp) {
  const patternText = tokenize((exp.patterns || []).join(' '));
  for (const t of queryTokens) if (patternText.has(t)) return 1;
  return 0;
}

// ---------- routes ----------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(API_KEY),
    model: GEN_MODEL,
    embedModel: EMBED_MODEL,
    storage: 'sqlite+fts5',
    relevanceModel: isModelLoaded() ? 'trained-logistic-regression' : 'fallback-fixed-weights'
  });
});

/**
 * POST /api/ingest — Experience Extractor
 */
app.post('/api/ingest', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) return res.status(400).json({ error: 'rawText is required' });

    const prompt = `You are extracting a structured "experience record" from a raw AI/developer debugging session, for a persistent experience-memory system. The system's core promise is to remember the PROBLEM-SOLVING PROCESS — not just the final answer — including failed attempts, so future similar problems can be solved faster.

RAW SESSION:
"""
${rawText}
"""

Respond with ONLY strict JSON, no markdown fences, in this exact shape:
{
  "problem_summary": "one sentence describing the core problem",
  "symptoms": ["short symptom phrases, e.g. exact error text or observed behavior"],
  "technologies": ["languages, frameworks, libraries involved"],
  "patterns": ["abstract pattern tags, e.g. 'null-undefined', 'race-condition', 'off-by-one'"],
  "failed_approaches": ["short descriptions of things that were tried and did NOT work, empty array if none mentioned"],
  "successful_approach": "short description of what actually worked, or empty string if unresolved",
  "root_cause": "one sentence root cause, best guess if not explicit",
  "solution": "concrete fix/solution text",
  "lesson": "one generalizable lesson for next time, phrased as advice",
  "confidence": "low | medium | high — how confident this extraction is, given how much detail was in the raw session"
}`;

    const text = await geminiGenerate(prompt);
    const parsed = safeParseJSON(text);

    const embedding = await geminiEmbed(
      `${parsed.problem_summary}\n${(parsed.symptoms || []).join(' ')}\n${(parsed.technologies || []).join(' ')}\n${parsed.root_cause}\n${parsed.solution}\n${parsed.lesson}`
    );

    const experience = {
      id: crypto.randomUUID(),
      scope: 'project',
      ...parsed,
      embedding,
      source: 'manual-ingest',
      createdAt: new Date().toISOString()
    };
    db.insertExperience(experience);

    res.json(clean(experience));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/retrieve — Hybrid retrieval:
 *   1. FTS5 lexical candidates (real SQLite full-text search)
 *   2. Semantic similarity via embeddings (Gemini)
 *   3. Structured features (tech match, pattern match)
 *   4. Trained logistic regression relevance model scores + ranks
 *
 * Fails soft: if the embedding call fails (rate limit / network), retrieval
 * still returns FTS5-only lexical results instead of a hard 500 — this is
 * the reliability principle from the architecture doc ("LLM/embeddings
 * unavailable -> retrieval still works").
 */
// Core retrieval logic, factored out so /api/retrieve and /api/chat share
// one implementation instead of drifting apart over time.
async function runRetrieval(queryText, { logRecall = true, scopes = null } = {}) {
  const { tokens: queryTokens } = extractQuerySignals(queryText);
  let experiences = db.getAllExperiences();
  if (scopes) experiences = experiences.filter(e => scopes.includes(e.scope));

  const ftsScores = db.ftsSearch(queryText, experiences.length || 50);

  let queryEmbedding = null;
  let embeddingAvailable = true;
  try {
    queryEmbedding = await geminiEmbed(queryText);
  } catch (embedErr) {
    embeddingAvailable = false;
  }

  const scored = experiences.map(exp => {
    const semanticSim = embeddingAvailable ? cosineSimilarity(queryEmbedding, exp.embedding) : 0;
    const lexicalOverlap = ftsScores[exp.id] || 0;
    const techMatch = techMatchFeature(queryTokens, exp);
    const patternMatch = patternMatchFeature(queryTokens, exp);

    const similarity = embeddingAvailable
      ? scoreRelevance({ semanticSim, lexicalOverlap, techMatch, patternMatch })
      : lexicalOverlap;

    return {
      ...clean(exp),
      similarity: Number(similarity.toFixed(4)),
      semanticSim: Number(semanticSim.toFixed(4)),
      lexicalOverlap: Number(lexicalOverlap.toFixed(4)),
      feature_breakdown: {
        semanticSim: Number(semanticSim.toFixed(4)),
        lexicalOverlap: Number(lexicalOverlap.toFixed(4)),
        techMatch,
        patternMatch
      }
    };
  })
    .filter(e => e.similarity >= (embeddingAvailable ? 0.5 : 0.15))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  if (logRecall) {
    for (const m of scored) {
      db.insertRecallEvent({
        id: crypto.randomUUID(),
        query: queryText,
        experience_id: m.id,
        retrieval_score: m.similarity,
        used_in_report: false,
        created_at: new Date().toISOString()
      });
    }
  }

  return { matches: scored, degraded: !embeddingAvailable };
}

app.post('/api/retrieve', async (req, res) => {
  try {
    const { queryText } = req.body;
    if (!queryText || !queryText.trim()) return res.status(400).json({ error: 'queryText is required' });
    const result = await runRetrieval(queryText);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/report — Report Builder
 */
app.post('/api/report', async (req, res) => {
  try {
    const { queryText, matchIds = [] } = req.body;
    if (!queryText || !queryText.trim()) return res.status(400).json({ error: 'queryText is required' });

    const experiences = db.getAllExperiences();
    const matched = matchIds.length
      ? experiences.filter(e => matchIds.includes(e.id))
      : [];

    if (matched.length === 0) {
      return res.json({ report: 'No sufficiently similar prior experience found. This appears to be a new type of problem — no MISTAKEMEMO_REPORT to generate yet.' });
    }

    const experienceBlock = matched.map((e, i) => `
Experience ${i + 1} (confidence: ${e.confidence}):
- Problem: ${e.problem_summary}
- Root cause: ${e.root_cause}
- Failed approaches: ${(e.failed_approaches || []).join('; ') || 'none recorded'}
- Successful approach: ${e.successful_approach || 'unresolved'}
- Solution: ${e.solution}
- Lesson: ${e.lesson}`).join('\n');

    const prompt = `You are building a MISTAKEMEMO_REPORT: a compact briefing handed to an LLM or developer BEFORE they attempt a new problem, so their first attempt is informed by past experience — especially past FAILURES, so they aren't repeated.

NEW PROBLEM:
"""
${queryText}
"""

RELEVANT PAST EXPERIENCES:
${experienceBlock}

Write a MISTAKEMEMO_REPORT as plain text (not JSON), under 150 words, with this structure:
- One line: how this connects to past experience.
- A short list of approaches to AVOID (from failed_approaches) and why.
- A short recommended next action grounded in what worked before.
Keep it dense and actionable, no filler, no restating the raw problem back verbatim.`;

    const genRes = await fetch(GEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    if (!genRes.ok) throw new Error(`Gemini generate failed (${genRes.status}): ${await genRes.text()}`);
    const genData = await genRes.json();
    const report = genData?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';

    res.json({ report });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/experiences', (req, res) => {
  const experiences = db.getAllExperiences().map(clean);
  res.json(experiences);
});

app.get('/api/experiences/:id', (req, res) => {
  const exp = db.getExperienceById(req.params.id);
  if (!exp) return res.status(404).json({ error: 'not found' });
  res.json(clean(exp));
});

/**
 * GET /api/dashboard/stats — progress dashboard aggregates.
 * Pure SQL/JS aggregation, no LLM call, so this always works even if the
 * Gemini API is unavailable.
 */
app.get('/api/dashboard/stats', (req, res) => {
  try {
    res.json(db.getDashboardStats());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/chat/patterns — top recurring patterns across all experiences.
 */
app.get('/api/chat/patterns', (req, res) => {
  try {
    res.json({ patterns: db.getTopPatterns(10) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/chat — lightweight coach chatbot.
 * Retrieves relevant experiences across project+universal scope, then asks
 * Gemini to answer AS A COACH, citing experience ids. If the LLM call fails
 * (or there's no API key), degrades to a structured list of the retrieved
 * experiences instead of crashing or returning nothing — same reliability
 * principle as /api/retrieve.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });

    const retrieval = await runRetrieval(message, { logRecall: true, scopes: ['project', 'universal'] });

    if (retrieval.matches.length === 0) {
      return res.json({
        reply: "No pattern yet — I don't have any past experience that looks related to this. Once you log a mistake here, I'll be able to reference it next time something similar comes up.",
        citedExperienceIds: [],
        degraded: retrieval.degraded
      });
    }

    const experienceBlock = retrieval.matches.map((e, i) =>
      `[${e.id}] ${e.problem_summary} — failed: ${(e.failed_approaches || []).join('; ') || 'none recorded'} — worked: ${e.successful_approach || 'unresolved'} — lesson: ${e.lesson}`
    ).join('\n');

    try {
      if (!API_KEY) throw new Error('no api key'); // force the fallback path below
      const prompt = `You are a coding coach with access to the developer's past debugging experiences. Answer their message using ONLY the experiences below as grounding. Cite experience ids in square brackets like [id] when you reference one. Be concise (under 120 words).

DEVELOPER MESSAGE:
"""
${message}
"""

RELEVANT PAST EXPERIENCES:
${experienceBlock}`;

      const reply = await geminiGenerate(prompt);
      res.json({
        reply,
        citedExperienceIds: retrieval.matches.map(m => m.id),
        degraded: retrieval.degraded
      });
    } catch (llmErr) {
      // LLM unavailable -> degrade to a formatted experience list, never crash
      const fallbackReply = 'AI coaching is unavailable right now, but here is what I found in your memory:\n\n' +
        retrieval.matches.map(e => `• ${e.problem_summary}\n  Worked before: ${e.successful_approach || 'unresolved'}\n  Lesson: ${e.lesson}`).join('\n\n');
      res.json({
        reply: fallbackReply,
        citedExperienceIds: retrieval.matches.map(m => m.id),
        degraded: true,
        llmUnavailable: true
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/experiences/:id', (req, res) => {
  db.deleteExperience(req.params.id);
  res.json({ deleted: 1 });
});

// One-click demo seed so retrieval/report never hit an empty store during judging
app.post('/api/seed-demo', async (req, res) => {
  try {
    const seeds = [
      {
        problem_summary: "App crashes with 'Cannot read properties of undefined' when rendering a list from an API response",
        symptoms: ["TypeError: Cannot read properties of undefined (reading 'map')", "blank screen on first render"],
        technologies: ['react', 'javascript', 'fetch'],
        patterns: ['null-undefined', 'race-condition'],
        failed_approaches: ['added optional chaining only on the crash line, error moved elsewhere', 'wrapped in try/catch, hid the error but list stayed empty'],
        successful_approach: 'initialized state as an empty array and gated the render behind a loading flag',
        root_cause: 'component rendered before the async fetch resolved, so state was still undefined',
        solution: "useState([]) for the list, plus `if (loading) return <Spinner />` before mapping",
        lesson: 'always initialize async-derived state to its empty form, and gate rendering on a loading flag rather than patching each access site',
        confidence: 'high'
      },
      {
        problem_summary: 'Unhandled promise rejection when chaining an async call inside a .then()',
        symptoms: ['UnhandledPromiseRejectionWarning', 'silent failure, no stack trace in UI'],
        technologies: ['javascript', 'node', 'async-await'],
        patterns: ['async-await', 'error-swallowing'],
        failed_approaches: ['added a global unhandledRejection listener that just logged and continued'],
        successful_approach: 'converted the .then() chain to async/await with a single try/catch around the whole operation',
        root_cause: 'mixing .then() chains with async/await caused a rejected inner promise to bypass the outer catch',
        solution: 'rewrote the function as fully async/await with one try/catch boundary',
        lesson: "don't mix .then() chains and async/await in the same function — pick one style per function",
        confidence: 'medium',
        scope: 'project'
      },
      {
        problem_summary: "CORS error blocking API calls from the frontend in local dev",
        symptoms: ["Access-Control-Allow-Origin header missing", "fetch failed with CORS error in console"],
        technologies: ['express', 'cors', 'fetch'],
        patterns: ['cors', 'config'],
        failed_approaches: ['tried adding headers manually per-route, missed the preflight OPTIONS request'],
        successful_approach: 'installed the cors middleware package and applied it globally before routes',
        root_cause: 'browser preflight OPTIONS request was never handled, so the real request never left the browser',
        solution: "app.use(cors()) before any route definitions",
        lesson: 'CORS middleware needs to be registered before routes, and must handle the OPTIONS preflight, not just the real request',
        confidence: 'high',
        scope: 'universal'
      },
      {
        problem_summary: 'Off-by-one error causing the last item in a paginated list to be skipped',
        symptoms: ['last row missing from results', 'pagination total count looked right but display was short by one'],
        technologies: ['sql', 'pagination'],
        patterns: ['off-by-one', 'logic'],
        failed_approaches: ['adjusted LIMIT without checking OFFSET math, made it worse'],
        successful_approach: 'recalculated offset as (page - 1) * pageSize and added a unit test with a known dataset',
        root_cause: 'offset formula used `page * pageSize` instead of `(page - 1) * pageSize`',
        solution: 'fixed offset formula and added a regression test for page boundaries',
        lesson: 'always unit-test pagination math with a small, known dataset before trusting it against real data',
        confidence: 'high',
        scope: 'universal'
      },
      {
        problem_summary: 'React state update not reflected immediately after setState call',
        symptoms: ['console.log right after setState shows the old value', 'UI updates a render late'],
        technologies: ['react', 'javascript'],
        patterns: ['state-management', 'async-await'],
        failed_approaches: ['tried reading state synchronously right after calling the setter'],
        successful_approach: 'used a useEffect hook keyed on the state variable to react to the update, instead of reading it inline',
        root_cause: 'React state updates are asynchronous/batched, so state is not updated in the same tick as the setter call',
        solution: 'moved the dependent logic into useEffect([stateVar])',
        lesson: 'never assume state is updated immediately after calling its setter — use an effect or the updater-function form instead',
        confidence: 'high',
        scope: 'project'
      },
      {
        problem_summary: 'Database migration failed halfway through, leaving schema in an inconsistent state',
        symptoms: ['migration script exited with error after creating some but not all tables', 'app crashed on next boot with "table not found"'],
        technologies: ['postgresql', 'migrations'],
        patterns: ['database', 'transactions'],
        failed_approaches: ['manually re-ran the migration script, which failed again because some tables already existed'],
        successful_approach: 'wrapped the entire migration in a single transaction so a failure rolls back everything, then fixed the actual bug and re-ran cleanly',
        root_cause: 'migration script was not transactional, so a partial failure left a half-applied schema',
        solution: 'wrap migrations in BEGIN/COMMIT with ROLLBACK on error',
        lesson: 'schema migrations should always be transactional — partial application is worse than no application',
        confidence: 'medium',
        scope: 'universal'
      },
      {
        problem_summary: 'Infinite re-render loop in a React component',
        symptoms: ['browser tab freezes', '"Maximum update depth exceeded" error in console'],
        technologies: ['react'],
        patterns: ['state-management', 'render-loop'],
        failed_approaches: ['removed the dependency array from useEffect entirely to "fix" the warning, made the loop worse'],
        successful_approach: 'identified the object being recreated on every render and memoized it with useMemo before passing it as a dependency',
        root_cause: 'a new object/array literal was created on every render and used inside a useEffect dependency array, so the effect never stabilized',
        solution: 'wrapped the object in useMemo so its reference is stable across renders',
        lesson: 'objects and arrays in dependency arrays need stable references — memoize them, or the effect will refire every render',
        confidence: 'high',
        scope: 'project'
      },
      {
        problem_summary: 'Docker container works locally but crashes immediately in production',
        symptoms: ['exit code 1 with no useful log output', 'works fine with `docker run` locally'],
        technologies: ['docker', 'node'],
        patterns: ['deployment', 'config'],
        failed_approaches: ['assumed it was a missing environment variable and added several blindly'],
        successful_approach: 'ran the exact production image locally with `docker logs` and found the real error: a missing native dependency in the slim base image',
        root_cause: 'the production Dockerfile used a slim base image missing a native library the app depended on at runtime',
        solution: 'switched to a base image with the required native libraries, or installed them explicitly in the Dockerfile',
        lesson: "when a container behaves differently in prod, reproduce with the EXACT same image and check logs before guessing at env vars",
        confidence: 'medium',
        scope: 'universal'
      },
      {
        problem_summary: 'API returns 401 Unauthorized intermittently, not consistently',
        symptoms: ['most requests succeed', 'roughly 1 in 20 requests returns 401 with a valid-looking token'],
        technologies: ['jwt', 'api', 'authentication'],
        patterns: ['auth', 'race-condition'],
        failed_approaches: ['assumed the token itself was invalid and regenerated it, problem persisted'],
        successful_approach: 'found that token refresh logic had a race condition: a request could fire with an about-to-expire token during the refresh window',
        root_cause: 'no locking/queueing around token refresh, so concurrent requests could use a token mid-expiry',
        solution: 'added a single in-flight refresh promise that concurrent requests await instead of each triggering their own refresh',
        lesson: 'intermittent auth failures under concurrency usually point to a race condition in token refresh, not the token itself',
        confidence: 'medium',
        scope: 'project'
      }
    ];

    let seededCount = 0;
    for (const s of seeds) {
      const embedding = await geminiEmbed(
        `${s.problem_summary}\n${s.symptoms.join(' ')}\n${s.technologies.join(' ')}\n${s.root_cause}\n${s.solution}\n${s.lesson}`
      );
      const { scope, ...rest } = s;
      db.insertExperience({
        id: crypto.randomUUID(),
        scope: scope || 'project',
        ...rest,
        embedding,
        source: 'seed-demo',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 10 + 1)).toISOString()
      });
      seededCount++;
    }
    res.json({ seeded: seededCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- startup ----------
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`MistakeMemo backend running on http://localhost:${PORT}`);
    console.log(`Storage: SQLite + FTS5 (data/mistakememo.sqlite)`);
    console.log(`Relevance model: ${isModelLoaded() ? 'trained logistic regression loaded' : 'NOT FOUND - run \`node scripts/train_relevance_model.js\`'}`);
    if (!API_KEY) {
      console.warn('WARNING: GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.');
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
