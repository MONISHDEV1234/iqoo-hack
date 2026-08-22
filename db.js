// ---------------------------------------------------------------------------
// SQLite storage layer, using sql.js (SQLite compiled to WASM).
//
// Why sql.js instead of better-sqlite3:
//   better-sqlite3 is a native addon — it needs a C++ compiler (node-gyp,
//   Visual Studio Build Tools on Windows) to install. That's a common source
//   of broken installs on a laptop that isn't already set up for native
//   Node builds. sql.js is pure WASM: `npm install sql.js` always works,
//   on any OS, with no compiler required. Tradeoff: the whole DB lives in
//   memory and we explicitly save it to a file after writes, instead of
//   SQLite managing the file on disk for us automatically.
//
// FTS5 is included in the standard sql.js WASM build, so lexical search
// is real SQLite FTS5, not a hand-rolled stand-in.
// ---------------------------------------------------------------------------

// sql.js-fts5 is a prebuilt sql.js WASM binary compiled with FTS5 enabled.
// Plain `sql.js` from npm does NOT include FTS5 (Google's own maintainers
// leave it out to keep the WASM file smaller) — using it would silently
// fail with "no such module: fts5" the moment we create the virtual table.
const initSqlJs = require('sql.js-fts5');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'mistakememo.sqlite');
const JSON_MIGRATE_PATH = path.join(__dirname, '..', 'data', 'experiences.json');

let SQL = null;
let db = null;

function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function tableExists(name) {
  const res = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`);
  return res.length > 0 && res[0].values.length > 0;
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      scope TEXT DEFAULT 'project',
      problem_summary TEXT,
      symptoms TEXT,            -- JSON array, stored as text
      technologies TEXT,        -- JSON array, stored as text
      patterns TEXT,            -- JSON array, stored as text
      failed_approaches TEXT,   -- JSON array, stored as text
      successful_approach TEXT,
      root_cause TEXT,
      solution TEXT,
      lesson TEXT,
      confidence TEXT,
      embedding TEXT,           -- JSON array of floats, stored as text
      source TEXT,
      createdAt TEXT
    );
  `);

  // FTS5 virtual table mirroring the searchable text fields.
  // content='experiences' + content_rowid means FTS5 stores no duplicate
  // text of its own — it indexes the parent table directly (contentless
  // shadow index), which keeps the DB smaller.
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS experiences_fts USING fts5(
      problem_summary, symptoms, technologies, patterns,
      content='experiences', content_rowid='rowid'
    );
  `);

  // Triggers keep the FTS index in sync automatically on every write —
  // this is exactly what real production SQLite+FTS5 setups do.
  db.run(`
    CREATE TRIGGER IF NOT EXISTS experiences_ai AFTER INSERT ON experiences BEGIN
      INSERT INTO experiences_fts(rowid, problem_summary, symptoms, technologies, patterns)
      VALUES (new.rowid, new.problem_summary, new.symptoms, new.technologies, new.patterns);
    END;
  `);
  db.run(`
    CREATE TRIGGER IF NOT EXISTS experiences_ad AFTER DELETE ON experiences BEGIN
      INSERT INTO experiences_fts(experiences_fts, rowid, problem_summary, symptoms, technologies, patterns)
      VALUES ('delete', old.rowid, old.problem_summary, old.symptoms, old.technologies, old.patterns);
    END;
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recall_events (
      id TEXT PRIMARY KEY,
      query TEXT,
      experience_id TEXT,
      retrieval_score REAL,
      user_feedback TEXT,
      used_in_report INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workspace TEXT,
      source TEXT,
      start_at TEXT,
      end_at TEXT,
      capture_enabled INTEGER DEFAULT 1,
      extracted_experience_count INTEGER DEFAULT 0
    );
  `);
}

function migrateFromJsonIfNeeded() {
  if (!fs.existsSync(JSON_MIGRATE_PATH)) return;
  let rows;
  try {
    rows = JSON.parse(fs.readFileSync(JSON_MIGRATE_PATH, 'utf-8') || '[]');
  } catch (e) {
    return;
  }
  if (!Array.isArray(rows) || rows.length === 0) return;

  const countRes = db.exec('SELECT COUNT(*) FROM experiences');
  const existingCount = countRes[0] ? countRes[0].values[0][0] : 0;
  if (existingCount > 0) return; // already migrated, don't duplicate

  const stmt = db.prepare(`
    INSERT INTO experiences
    (id, scope, problem_summary, symptoms, technologies, patterns,
     failed_approaches, successful_approach, root_cause, solution,
     lesson, confidence, embedding, source, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run([
      r.id, r.scope || 'project', r.problem_summary || '',
      JSON.stringify(r.symptoms || []), JSON.stringify(r.technologies || []),
      JSON.stringify(r.patterns || []), JSON.stringify(r.failed_approaches || []),
      r.successful_approach || '', r.root_cause || '', r.solution || '',
      r.lesson || '', r.confidence || '', JSON.stringify(r.embedding || []),
      r.source || 'migrated', r.createdAt || new Date().toISOString()
    ]);
  }
  stmt.free();
  console.log(`Migrated ${rows.length} experience(s) from experiences.json into SQLite.`);
}

async function initDb() {
  if (db) return db;
  // sql.js-fts5's loader tries to fetch() the .wasm file, which is a
  // browser-oriented code path that doesn't work reliably in plain Node.
  // Reading the binary ourselves and passing it as `wasmBinary` sidesteps
  // that fetch entirely — no network request, just a local file read.
  const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js-fts5', 'dist', 'sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  SQL = await initSqlJs({ wasmBinary });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createSchema();
  migrateFromJsonIfNeeded();
  persist();
  return db;
}

function rowToExperience(cols, row) {
  const obj = {};
  cols.forEach((c, i) => { obj[c] = row[i]; });
  obj.symptoms = JSON.parse(obj.symptoms || '[]');
  obj.technologies = JSON.parse(obj.technologies || '[]');
  obj.patterns = JSON.parse(obj.patterns || '[]');
  obj.failed_approaches = JSON.parse(obj.failed_approaches || '[]');
  obj.embedding = JSON.parse(obj.embedding || '[]');
  return obj;
}

function insertExperience(exp) {
  db.run(`
    INSERT INTO experiences
    (id, scope, problem_summary, symptoms, technologies, patterns,
     failed_approaches, successful_approach, root_cause, solution,
     lesson, confidence, embedding, source, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    exp.id, exp.scope || 'project', exp.problem_summary || '',
    JSON.stringify(exp.symptoms || []), JSON.stringify(exp.technologies || []),
    JSON.stringify(exp.patterns || []), JSON.stringify(exp.failed_approaches || []),
    exp.successful_approach || '', exp.root_cause || '', exp.solution || '',
    exp.lesson || '', exp.confidence || '', JSON.stringify(exp.embedding || []),
    exp.source || 'manual-ingest', exp.createdAt || new Date().toISOString()
  ]);
  persist();
}

function getAllExperiences() {
  const res = db.exec('SELECT rowid, * FROM experiences ORDER BY createdAt DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns.filter(c => c !== 'rowid');
  const rowidIdx = res[0].columns.indexOf('rowid');
  return res[0].values.map(row => {
    const withoutRowid = row.filter((_, i) => i !== rowidIdx);
    return rowToExperience(cols, withoutRowid);
  });
}

function deleteExperience(id) {
  db.run('DELETE FROM experiences WHERE id = ?', [id]);
  persist();
}

// FTS5 lexical candidate search. Returns experience ids ranked by SQLite's
// built-in bm25 relevance score (lower = more relevant, so we negate it
// to a 0..1-ish "higher is better" number for blending with semantic score).
function ftsSearch(queryText, limit = 50) {
  const escaped = queryText.replace(/['"]/g, ' ').trim();
  if (!escaped) return {};
  // Build an FTS5 MATCH query: OR together the individual terms so partial
  // matches still surface, rather than requiring every word to match.
  const terms = escaped.split(/\s+/).filter(Boolean).map(t => `"${t}"`).join(' OR ');
  if (!terms) return {};

  let res;
  try {
    res = db.exec(`
      SELECT e.id, bm25(experiences_fts) as score
      FROM experiences_fts
      JOIN experiences e ON e.rowid = experiences_fts.rowid
      WHERE experiences_fts MATCH ?
      ORDER BY score
      LIMIT ?
    `, [terms, limit]);
  } catch (e) {
    // Malformed FTS query (rare edge case with special chars) — fail soft.
    return {};
  }

  if (res.length === 0) return {};
  const scores = {};
  const rawScores = res[0].values.map(r => r[1]);
  const minScore = Math.min(...rawScores); // bm25: more negative = more relevant
  const maxScore = Math.max(...rawScores);
  const range = maxScore - minScore || 1;
  for (const [id, score] of res[0].values) {
    // normalize bm25 (lower/more-negative = better) into 0..1 (higher = better)
    scores[id] = 1 - (score - minScore) / range;
  }
  return scores;
}

function insertRecallEvent(evt) {
  db.run(`
    INSERT INTO recall_events (id, query, experience_id, retrieval_score, user_feedback, used_in_report, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [evt.id, evt.query, evt.experience_id, evt.retrieval_score, evt.user_feedback || null, evt.used_in_report ? 1 : 0, evt.created_at]);
  persist();
}

module.exports = {
  initDb,
  insertExperience,
  getAllExperiences,
  deleteExperience,
  ftsSearch,
  insertRecallEvent,
};
