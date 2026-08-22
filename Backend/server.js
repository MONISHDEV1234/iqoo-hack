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
app.post('/api/retrieve', async (req, res) => {
  try {
    const { queryText } = req.body;
    if (!queryText || !queryText.trim()) return res.status(400).json({ error: 'queryText is required' });

    const { tokens: queryTokens } = extractQuerySignals(queryText);
    const experiences = db.getAllExperiences();

    // Real SQLite FTS5 lexical candidate scores (id -> normalized 0..1 score)
    const ftsScores = db.ftsSearch(queryText, experiences.length || 50);

    let queryEmbedding = null;
    let embeddingAvailable = true;
    try {
      queryEmbedding = await geminiEmbed(queryText);
    } catch (embedErr) {
      embeddingAvailable = false; // degrade gracefully instead of failing the whole request
    }

    const scored = experiences.map(exp => {
      const semanticSim = embeddingAvailable ? cosineSimilarity(queryEmbedding, exp.embedding) : 0;
      const lexicalOverlap = ftsScores[exp.id] || 0;
      const techMatch = techMatchFeature(queryTokens, exp);
      const patternMatch = patternMatchFeature(queryTokens, exp);

      const similarity = embeddingAvailable
        ? scoreRelevance({ semanticSim, lexicalOverlap, techMatch, patternMatch })
        : lexicalOverlap; // fallback: FTS5-only ranking when embeddings are unavailable

      return {
        ...clean(exp),
        similarity: Number(similarity.toFixed(4)),
        semanticSim: Number(semanticSim.toFixed(4)),
        lexicalOverlap: Number(lexicalOverlap.toFixed(4))
      };
    })
      .filter(e => e.similarity >= (embeddingAvailable ? 0.5 : 0.15))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    // log recall events (doc's recall_events table) for future retraining data
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

    res.json({ matches: scored, degraded: !embeddingAvailable });
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
        confidence: 'medium'
      }
    ];

    let seededCount = 0;
    for (const s of seeds) {
      const embedding = await geminiEmbed(
        `${s.problem_summary}\n${s.symptoms.join(' ')}\n${s.technologies.join(' ')}\n${s.root_cause}\n${s.solution}\n${s.lesson}`
      );
      db.insertExperience({
        id: crypto.randomUUID(),
        scope: 'project',
        ...s,
        embedding,
        source: 'seed-demo',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
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
