"""
seed/seed_memories.py — 18 realistic debugging experiences + 3 universal patterns.
Run directly: python seed/seed_memories.py
Idempotent — checks if seed data already exists before inserting.
"""
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db import get_conn, init_db
from retrieval.embeddings import embed, to_blob

EXPERIENCES = [
    # ── API / FastAPI ──────────────────────────────────────────────────────
    {
        "scope": "project", "title": "FastAPI 422 on POST — missing required field",
        "problem_summary": "FastAPI returns 422 Unprocessable Entity when posting to /users endpoint. Pydantic validation fails silently.",
        "symptoms": ["422 Unprocessable Entity", "response body shows 'field required'", "curl works but JS fetch fails"],
        "error_codes": ["422"],
        "context": {"language": "python", "framework": ["fastapi"], "libraries": ["pydantic"], "env": "local"},
        "category": "api",
        "technologies": ["python", "fastapi", "pydantic"],
        "patterns": ["missing required field", "pydantic validation", "request body mismatch"],
        "hypotheses": ["Frontend sends wrong field names", "Content-Type header missing"],
        "attempts": [
            {"hypothesis": "Missing Content-Type", "action": "Added Content-Type: application/json header", "result": "failed", "evidence": "Still 422"},
            {"hypothesis": "Wrong field name", "action": "Checked schema vs request body", "result": "passed", "evidence": "Frontend sent 'userName' not 'username'"}
        ],
        "failed_approaches": ["Adding Content-Type header alone", "Restarting server"],
        "successful_approach": "Fixed frontend field name to match Pydantic model exactly (case-sensitive)",
        "root_cause": "Pydantic models are case-sensitive; frontend was sending camelCase but model expected snake_case",
        "solution": "Changed frontend to send snake_case field names matching the Pydantic schema",
        "verification": {"passed": 5, "failed": 0},
        "lesson": "Always validate exact field names and casing between frontend payload and Pydantic model. Use Pydantic's alias_generator for camelCase support.",
        "recommended_next_action": "Add an alias_generator to your Pydantic model or standardize on snake_case throughout",
        "confidence": 0.92, "project": "api-project", "source": "seed",
    },
    {
        "scope": "project", "title": "CORS blocking frontend requests to FastAPI",
        "problem_summary": "Frontend React app gets CORS error when fetching from FastAPI backend running on different port.",
        "symptoms": ["CORS policy blocked", "Access-Control-Allow-Origin missing", "preflight OPTIONS fails"],
        "error_codes": [],
        "context": {"language": "python", "framework": ["fastapi", "react"], "libraries": ["fastapi-cors"], "env": "local"},
        "category": "api",
        "technologies": ["python", "fastapi", "react"],
        "patterns": ["CORS misconfiguration", "cross-origin request", "preflight failure"],
        "hypotheses": ["CORSMiddleware not added", "Wrong allowed origins"],
        "attempts": [
            {"hypothesis": "CORSMiddleware missing", "action": "Added CORSMiddleware with allow_origins=['*']", "result": "passed", "evidence": "Requests go through"}
        ],
        "failed_approaches": ["Disabling browser security flags"],
        "successful_approach": "Added CORSMiddleware to FastAPI app with proper origin configuration",
        "root_cause": "FastAPI doesn't add CORS headers by default; middleware must be explicitly added",
        "solution": "app.add_middleware(CORSMiddleware, allow_origins=[...], allow_methods=['*'], allow_headers=['*'])",
        "verification": {"passed": 3, "failed": 0},
        "lesson": "Always add CORSMiddleware when frontend and backend run on different ports. Use specific origins in production, '*' only for dev.",
        "recommended_next_action": "Add CORS middleware and restrict origins before deploying to production",
        "confidence": 0.95, "project": "api-project", "source": "seed",
    },
    {
        "scope": "project", "title": "FastAPI async route blocking event loop",
        "problem_summary": "Async FastAPI endpoint becomes slow under load because synchronous DB call blocks the event loop.",
        "symptoms": ["slow response under load", "event loop blocked", "requests queue up"],
        "error_codes": [],
        "context": {"language": "python", "framework": ["fastapi", "sqlalchemy"], "libraries": ["asyncpg"], "env": "production"},
        "category": "performance",
        "technologies": ["python", "fastapi", "sqlalchemy"],
        "patterns": ["sync-in-async", "event loop blocking", "database bottleneck"],
        "hypotheses": ["Sync DB driver used in async route"],
        "attempts": [
            {"hypothesis": "sync driver blocking", "action": "Switched from psycopg2 to asyncpg", "result": "passed", "evidence": "Response time dropped from 800ms to 40ms"}
        ],
        "failed_approaches": ["Adding more workers", "Caching responses"],
        "successful_approach": "Replaced synchronous DB calls with async equivalents (asyncpg / databases library)",
        "root_cause": "Calling synchronous IO in an async route blocks the entire event loop for the duration of the call",
        "solution": "Use async-compatible database drivers or run sync code in a thread pool via asyncio.run_in_executor",
        "verification": {"passed": 8, "failed": 0},
        "lesson": "Never call synchronous IO directly in async FastAPI routes. Use async drivers or run_in_executor.",
        "recommended_next_action": "Audit all DB/IO calls in async routes and ensure they use await-compatible drivers",
        "confidence": 0.88, "project": "api-project", "source": "seed",
    },

    # ── Database / SQLite ──────────────────────────────────────────────────
    {
        "scope": "project", "title": "SQLite 'database is locked' under concurrent writes",
        "problem_summary": "SQLite raises 'database is locked' error when multiple threads write simultaneously.",
        "symptoms": ["database is locked", "OperationalError", "concurrent write failure"],
        "error_codes": ["OperationalError"],
        "context": {"language": "python", "framework": ["fastapi", "sqlite"], "libraries": ["sqlite3"], "env": "local"},
        "category": "database",
        "technologies": ["python", "sqlite3"],
        "patterns": ["concurrency issue", "write contention", "WAL mode"],
        "hypotheses": ["No WAL mode", "Connection not closed after write"],
        "attempts": [
            {"hypothesis": "No WAL mode", "action": "Enabled WAL mode: PRAGMA journal_mode=WAL", "result": "passed", "evidence": "No more lock errors under 10 concurrent writers"}
        ],
        "failed_approaches": ["Increasing timeout", "Retry loops without WAL"],
        "successful_approach": "Enabled WAL (Write-Ahead Logging) mode and ensured connections are closed after each request",
        "root_cause": "Default SQLite journal mode serializes all writes; WAL allows concurrent readers + one writer",
        "solution": "PRAGMA journal_mode=WAL; ensure connections are closed/returned to pool promptly",
        "verification": {"passed": 10, "failed": 0},
        "lesson": "Always enable WAL mode for SQLite in multi-threaded or async applications. Always close connections.",
        "recommended_next_action": "Add PRAGMA journal_mode=WAL to DB init and use connection pooling or per-request connections",
        "confidence": 0.91, "project": "data-project", "source": "seed",
    },
    {
        "scope": "project", "title": "FTS5 query syntax error with special characters",
        "problem_summary": "SQLite FTS5 MATCH query throws syntax error when search string contains special chars like quotes, dashes, or dots.",
        "symptoms": ["fts5: syntax error", "OperationalError on MATCH query", "search crashes on user input"],
        "error_codes": ["fts5: syntax error"],
        "context": {"language": "python", "framework": ["sqlite"], "libraries": ["sqlite3"], "env": "local"},
        "category": "database",
        "technologies": ["python", "sqlite3", "fts5"],
        "patterns": ["query injection", "input sanitization", "FTS5 special chars"],
        "hypotheses": ["User input not sanitized for FTS5", "FTS5 operators in search string"],
        "attempts": [
            {"hypothesis": "Special chars breaking FTS5 syntax", "action": "Wrapped terms in double quotes in query", "result": "passed", "evidence": "No more syntax errors"}
        ],
        "failed_approaches": ["Using LIKE instead of MATCH", "Removing all non-alphanumeric chars"],
        "successful_approach": "Sanitize input by escaping quotes and wrapping each token in double quotes for FTS5 MATCH",
        "root_cause": "FTS5 interprets certain characters (-, AND, OR, NOT, *, .) as operators; raw user input breaks query syntax",
        "solution": "Split input into tokens, wrap each in double quotes: '\"token1\" OR \"token2\"'",
        "verification": {"passed": 6, "failed": 0},
        "lesson": "Always sanitize FTS5 search input. Tokenize and quote each word individually.",
        "recommended_next_action": "Add a sanitize_fts_query() helper and use it everywhere you build MATCH queries",
        "confidence": 0.87, "project": "data-project", "source": "seed",
    },
    {
        "scope": "project", "title": "JSON field not updating in SQLite due to string comparison",
        "problem_summary": "Updating a JSON-stored array field in SQLite doesn't work because json_patch/json_set wasn't used; raw string comparison fails.",
        "symptoms": ["UPDATE has no effect", "json field unchanged after update", "WHERE clause on json field always false"],
        "error_codes": [],
        "context": {"language": "python", "framework": ["sqlite"], "libraries": ["sqlite3"], "env": "local"},
        "category": "database",
        "technologies": ["python", "sqlite3"],
        "patterns": ["json field update", "SQLite JSON1", "string vs json comparison"],
        "hypotheses": ["Using string comparison on JSON field"],
        "attempts": [
            {"hypothesis": "String comparison on JSON", "action": "Used json_extract() in WHERE clause", "result": "passed", "evidence": "UPDATE now affects correct rows"}
        ],
        "failed_approaches": ["Direct string comparison", "LIKE on json field"],
        "successful_approach": "Used json_extract() for querying and json_set() / json_patch() for updates",
        "root_cause": "JSON fields are stored as text; comparing them directly as strings fails for nested values",
        "solution": "Use json_extract(field, '$.key') in WHERE clauses and json_set(field, '$.key', value) for updates",
        "verification": {"passed": 4, "failed": 0},
        "lesson": "Use SQLite JSON1 functions (json_extract, json_set) for all JSON field operations — never raw string comparison.",
        "recommended_next_action": "Replace string comparisons on JSON fields with json_extract() calls",
        "confidence": 0.83, "project": "data-project", "source": "seed",
    },

    # ── Authentication ─────────────────────────────────────────────────────
    {
        "scope": "project", "title": "JWT token expires immediately — wrong exp format",
        "problem_summary": "JWT tokens expire immediately after issuance because exp was set as a datetime object instead of a Unix timestamp integer.",
        "symptoms": ["token expired immediately", "401 on first request after login", "JWT validation fails"],
        "error_codes": ["401"],
        "context": {"language": "python", "framework": ["fastapi", "jose"], "libraries": ["python-jose"], "env": "local"},
        "category": "authentication",
        "technologies": ["python", "jwt", "fastapi"],
        "patterns": ["JWT exp format", "datetime vs timestamp", "token validation"],
        "hypotheses": ["exp set as datetime not int", "timezone mismatch"],
        "attempts": [
            {"hypothesis": "exp is datetime object", "action": "Changed to int(datetime.utcnow().timestamp()) + 3600", "result": "passed", "evidence": "Token valid for 1 hour as expected"}
        ],
        "failed_approaches": ["Increasing expiry time without fixing type", "Using local time instead of UTC"],
        "successful_approach": "Set exp as integer Unix timestamp: int(datetime.utcnow().timestamp()) + seconds",
        "root_cause": "JWT spec requires exp as a NumericDate (Unix timestamp integer); passing a datetime object causes immediate expiry",
        "solution": "exp = int(datetime.utcnow().timestamp()) + ACCESS_TOKEN_EXPIRE_SECONDS",
        "verification": {"passed": 5, "failed": 0},
        "lesson": "JWT exp must be an integer Unix timestamp. Always use datetime.utcnow(), not datetime.now(), and convert to int.",
        "recommended_next_action": "Audit all JWT creation code and ensure exp is an int Unix timestamp in UTC",
        "confidence": 0.93, "project": "auth-project", "source": "seed",
    },
    {
        "scope": "project", "title": "bcrypt hash comparison always returns False",
        "problem_summary": "Password verification always fails even with correct password because bcrypt.checkpw received str instead of bytes.",
        "symptoms": ["login always fails", "password check returns False", "no error thrown"],
        "error_codes": [],
        "context": {"language": "python", "framework": ["fastapi"], "libraries": ["bcrypt", "passlib"], "env": "local"},
        "category": "authentication",
        "technologies": ["python", "bcrypt"],
        "patterns": ["bytes vs string", "encoding issue", "silent failure"],
        "hypotheses": ["Passing str not bytes to bcrypt", "Hash stored incorrectly"],
        "attempts": [
            {"hypothesis": "str instead of bytes", "action": "Encoded password to bytes: password.encode('utf-8')", "result": "passed", "evidence": "checkpw returns True for correct password"}
        ],
        "failed_approaches": ["Rehashing password on every login", "Checking hash directly"],
        "successful_approach": "Encoded both password and hash to bytes before calling bcrypt.checkpw",
        "root_cause": "bcrypt.checkpw requires bytes, not str; passing str silently returns False",
        "solution": "bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8') if isinstance(hashed, str) else hashed)",
        "verification": {"passed": 7, "failed": 0},
        "lesson": "bcrypt always requires bytes. Encode strings explicitly before passing to any bcrypt function.",
        "recommended_next_action": "Wrap bcrypt calls in a helper that handles encoding, add a unit test for correct/incorrect password",
        "confidence": 0.9, "project": "auth-project", "source": "seed",
    },

    # ── Frontend / React ───────────────────────────────────────────────────
    {
        "scope": "project", "title": "React useEffect infinite loop on object dependency",
        "problem_summary": "useEffect with an object in the dependency array triggers on every render because object reference changes each render.",
        "symptoms": ["infinite re-render", "component freezes browser", "network requests flood"],
        "error_codes": [],
        "context": {"language": "typescript", "framework": ["react"], "libraries": [], "env": "browser"},
        "category": "frontend",
        "technologies": ["typescript", "react"],
        "patterns": ["infinite loop", "useEffect dependency", "object reference equality"],
        "hypotheses": ["Object reference changes each render causing dependency match to fail"],
        "attempts": [
            {"hypothesis": "Object recreated each render", "action": "Moved object outside component", "result": "failed", "evidence": "Object needs state values"},
            {"hypothesis": "Deep comparison needed", "action": "Used useMemo to stabilize object reference", "result": "passed", "evidence": "Effect runs once on mount"}
        ],
        "failed_approaches": ["Moving object outside component", "Using JSON.stringify in dependency"],
        "successful_approach": "Wrapped the object in useMemo with proper primitive dependencies",
        "root_cause": "React uses Object.is() for dependency comparison; a new object literal is never equal to the previous one even if values are the same",
        "solution": "const stableObj = useMemo(() => ({ key: value }), [value]); then use stableObj in useEffect deps",
        "verification": {"passed": 3, "failed": 0},
        "lesson": "Never put unstable object/array references directly in useEffect deps. Stabilize with useMemo/useCallback.",
        "recommended_next_action": "Audit all useEffect dependency arrays — replace objects with their primitive values or wrap in useMemo",
        "confidence": 0.89, "project": "frontend-project", "source": "seed",
    },
    {
        "scope": "project", "title": "React state update on unmounted component",
        "problem_summary": "Warning: Can't perform a React state update on an unmounted component. Appears after async fetch in useEffect.",
        "symptoms": ["memory leak warning", "setState on unmounted component", "stale closure in async"],
        "error_codes": [],
        "context": {"language": "typescript", "framework": ["react"], "libraries": [], "env": "browser"},
        "category": "frontend",
        "technologies": ["typescript", "react"],
        "patterns": ["cleanup function", "async useEffect", "unmount race"],
        "hypotheses": ["No cleanup in useEffect", "Fetch completes after component unmounts"],
        "attempts": [
            {"hypothesis": "No cleanup", "action": "Added AbortController and cancelled fetch on cleanup", "result": "passed", "evidence": "No more warning"}
        ],
        "failed_approaches": ["Wrapping setState in try/catch", "Ignoring the warning"],
        "successful_approach": "Used AbortController in useEffect cleanup to cancel in-flight requests",
        "root_cause": "Async fetch inside useEffect completes after component unmounts and tries to call setState",
        "solution": "const controller = new AbortController(); fetch(url, {signal: controller.signal}); return () => controller.abort();",
        "verification": {"passed": 4, "failed": 0},
        "lesson": "Always return a cleanup function from useEffect that cancels async operations (fetch, timers, subscriptions).",
        "recommended_next_action": "Add AbortController pattern to all useEffect hooks that make async calls",
        "confidence": 0.91, "project": "frontend-project", "source": "seed",
    },

    # ── Build / Environment ────────────────────────────────────────────────
    {
        "scope": "project", "title": "Module not found after npm install — wrong import path casing",
        "problem_summary": "Build fails with 'Module not found' on CI (Linux) but works locally (macOS/Windows) due to case-sensitive filesystem.",
        "symptoms": ["Module not found", "works locally fails on CI", "case sensitivity error"],
        "error_codes": [],
        "context": {"language": "typescript", "framework": ["vite", "react"], "libraries": [], "env": "ci"},
        "category": "build",
        "technologies": ["typescript", "vite", "node"],
        "patterns": ["filesystem case sensitivity", "CI vs local difference", "import path"],
        "hypotheses": ["Import path casing doesn't match actual filename"],
        "attempts": [
            {"hypothesis": "Case mismatch", "action": "Fixed import from './Components/Header' to './components/Header'", "result": "passed", "evidence": "CI build passes"}
        ],
        "failed_approaches": ["Clearing node_modules", "Reinstalling dependencies"],
        "successful_approach": "Fixed import statement casing to exactly match the actual filename on disk",
        "root_cause": "macOS/Windows have case-insensitive filesystems; Linux (CI) does not. Import './Components/foo' fails on Linux if file is './components/foo'",
        "solution": "Fix all import paths to match exact casing of filenames. Consider adding an ESLint rule to enforce it.",
        "verification": {"passed": 6, "failed": 0},
        "lesson": "Always match import path casing exactly to the file on disk. Test on Linux or use eslint-plugin-import to catch this early.",
        "recommended_next_action": "Search for import path casing mismatches and add eslint-plugin-import to CI",
        "confidence": 0.85, "project": "build-project", "source": "seed",
    },
    {
        "scope": "project", "title": "pip install fails — mismatched Python version in venv",
        "problem_summary": "pip install fails with incompatible Python version error because venv was created with different Python than system default.",
        "symptoms": ["ERROR: Package requires Python >=3.11", "pip install fails", "wrong python in venv"],
        "error_codes": [],
        "context": {"language": "python", "framework": [], "libraries": [], "env": "local"},
        "category": "environment_config",
        "technologies": ["python", "pip"],
        "patterns": ["python version mismatch", "virtual environment", "dependency resolution"],
        "hypotheses": ["venv created with wrong python version"],
        "attempts": [
            {"hypothesis": "Wrong python in venv", "action": "Deleted venv, recreated with python3.11 -m venv .venv", "result": "passed", "evidence": "pip install succeeds"}
        ],
        "failed_approaches": ["Upgrading pip alone", "Using --ignore-requires-python flag"],
        "successful_approach": "Deleted and recreated venv specifying the correct Python version explicitly",
        "root_cause": "Virtual environment was created with Python 3.9 but packages require 3.11+",
        "solution": "python3.11 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt",
        "verification": {"passed": 3, "failed": 0},
        "lesson": "Always specify the Python version explicitly when creating a venv. Check python --version inside the venv before installing.",
        "recommended_next_action": "Add a .python-version file or pyproject.toml with requires-python to lock the version",
        "confidence": 0.86, "project": "build-project", "source": "seed",
    },

    # ── Testing ────────────────────────────────────────────────────────────
    {
        "scope": "project", "title": "pytest fixtures not being found across modules",
        "problem_summary": "pytest can't find fixtures defined in conftest.py when tests are in a subdirectory without __init__.py.",
        "symptoms": ["fixture not found", "E fixture 'client' not found", "conftest not loaded"],
        "error_codes": ["E fixture"],
        "context": {"language": "python", "framework": ["pytest", "fastapi"], "libraries": [], "env": "local"},
        "category": "testing",
        "technologies": ["python", "pytest"],
        "patterns": ["fixture scope", "conftest.py", "test discovery"],
        "hypotheses": ["Missing __init__.py", "conftest.py in wrong directory"],
        "attempts": [
            {"hypothesis": "Missing __init__.py", "action": "Added __init__.py to tests/ directory", "result": "failed", "evidence": "Still not found"},
            {"hypothesis": "conftest in wrong dir", "action": "Moved conftest.py to project root", "result": "passed", "evidence": "Fixtures found in all test files"}
        ],
        "failed_approaches": ["Adding __init__.py", "Rerunning with -v"],
        "successful_approach": "Placed conftest.py at the project root (same level as pytest.ini / pyproject.toml)",
        "root_cause": "pytest looks for conftest.py starting from the test file's directory up to rootdir. Placing it outside rootdir means it's never loaded.",
        "solution": "Place conftest.py at or above the directory where pytest is invoked from",
        "verification": {"passed": 9, "failed": 0},
        "lesson": "conftest.py must be at or above the test directory, within the pytest rootdir. Check rootdir in pytest output.",
        "recommended_next_action": "Verify pytest rootdir with 'pytest --collect-only' and place conftest.py there",
        "confidence": 0.88, "project": "testing-project", "source": "seed",
    },

    # ── Networking ────────────────────────────────────────────────────────
    {
        "scope": "project", "title": "WebSocket connection drops after 60s — nginx proxy timeout",
        "problem_summary": "WebSocket connections deployed behind nginx drop after exactly 60 seconds with no data exchange.",
        "symptoms": ["WebSocket drops at 60s", "connection closed unexpectedly", "proxy timeout"],
        "error_codes": [],
        "context": {"language": "python", "framework": ["fastapi", "nginx"], "libraries": ["websockets"], "env": "production"},
        "category": "networking",
        "technologies": ["python", "nginx", "websocket"],
        "patterns": ["proxy timeout", "keepalive", "WebSocket nginx config"],
        "hypotheses": ["nginx proxy_read_timeout", "no keepalive ping"],
        "attempts": [
            {"hypothesis": "nginx timeout", "action": "Set proxy_read_timeout 3600s in nginx config", "result": "passed", "evidence": "Connections stable for hours"}
        ],
        "failed_approaches": ["Increasing server-side timeout", "Adding client reconnect logic alone"],
        "successful_approach": "Set proxy_read_timeout and proxy_send_timeout to 3600 in nginx, added server-side ping every 30s",
        "root_cause": "nginx default proxy_read_timeout is 60s; idle WebSocket connections with no data are killed",
        "solution": "proxy_read_timeout 3600s; proxy_send_timeout 3600s; also add WS ping/pong to detect dead connections",
        "verification": {"passed": 5, "failed": 0},
        "lesson": "Always configure nginx proxy timeouts for WebSocket routes. Add application-level keepalive pings.",
        "recommended_next_action": "Add nginx location block with proxy_read_timeout 3600 and server-side ping every 30s",
        "confidence": 0.87, "project": "networking-project", "source": "seed",
    },

    # ── Dependency ────────────────────────────────────────────────────────
    {
        "scope": "project", "title": "Package version conflict — two libs require incompatible numpy",
        "problem_summary": "pip install fails with 'Cannot install X and Y because these package versions have conflicting dependencies' on numpy version.",
        "symptoms": ["conflicting dependencies", "ResolutionImpossible", "incompatible numpy versions"],
        "error_codes": ["ResolutionImpossible"],
        "context": {"language": "python", "framework": [], "libraries": ["numpy", "sentence-transformers"], "env": "local"},
        "category": "dependency",
        "technologies": ["python", "pip"],
        "patterns": ["dependency conflict", "version pinning", "dependency resolution"],
        "hypotheses": ["Two packages require different numpy major versions"],
        "attempts": [
            {"hypothesis": "numpy version conflict", "action": "Used pip-tools to generate locked requirements", "result": "failed", "evidence": "Still conflicting"},
            {"hypothesis": "One package has loose constraint", "action": "Pinned numpy==1.26.4 explicitly", "result": "passed", "evidence": "Install succeeds"}
        ],
        "failed_approaches": ["pip install --upgrade all packages", "Using conda without pinning"],
        "successful_approach": "Pinned the conflicting package to a version compatible with all dependents; used pip-compile to verify",
        "root_cause": "Two transitive dependencies required mutually exclusive numpy version ranges",
        "solution": "Pin numpy to a version in the intersection of both requirements; document the constraint with a comment",
        "verification": {"passed": 4, "failed": 0},
        "lesson": "When facing dependency conflicts, find the intersection of version requirements and pin explicitly. Use pip-tools pip-compile for reproducibility.",
        "recommended_next_action": "Run pip-compile to generate a fully pinned requirements.txt and commit it to the repo",
        "confidence": 0.84, "project": "ml-project", "source": "seed",
    },

    # ── State Management ───────────────────────────────────────────────────
    {
        "scope": "project", "title": "Zustand state update doesn't trigger re-render",
        "problem_summary": "Updating a nested object in Zustand store doesn't trigger component re-render because the reference isn't changed.",
        "symptoms": ["component not re-rendering", "state change not reflected in UI", "Zustand nested update"],
        "error_codes": [],
        "context": {"language": "typescript", "framework": ["react", "zustand"], "libraries": ["zustand"], "env": "browser"},
        "category": "state_management",
        "technologies": ["typescript", "react", "zustand"],
        "patterns": ["immutable update", "nested state", "reference equality"],
        "hypotheses": ["Mutating state directly", "Zustand requires new object reference"],
        "attempts": [
            {"hypothesis": "Direct mutation", "action": "Used spread operator to create new object: {...state, nested: {...state.nested, key: val}}", "result": "passed", "evidence": "Component re-renders correctly"}
        ],
        "failed_approaches": ["Calling set() with the same reference", "Using immer without enabling it"],
        "successful_approach": "Used immer middleware in Zustand or spread to ensure new object references on update",
        "root_cause": "Zustand (and React) use reference equality. Mutating a nested object doesn't change the top-level reference, so no re-render.",
        "solution": "Always return new object references when updating state: set(state => ({...state, nested: {...state.nested, key: val}}))",
        "verification": {"passed": 5, "failed": 0},
        "lesson": "Treat Zustand state as immutable. Always create new references when updating nested objects. Consider using Immer middleware.",
        "recommended_next_action": "Enable Immer middleware in Zustand for complex nested state to simplify updates",
        "confidence": 0.86, "project": "frontend-project", "source": "seed",
    },
    {
        "scope": "project", "title": "React Query cache stale after mutation — invalidation missing",
        "problem_summary": "After a successful POST mutation, the list view still shows stale data because query invalidation wasn't called.",
        "symptoms": ["UI shows old data after update", "list not refreshing after mutation", "stale cache"],
        "error_codes": [],
        "context": {"language": "typescript", "framework": ["react", "react-query"], "libraries": ["@tanstack/react-query"], "env": "browser"},
        "category": "state_management",
        "technologies": ["typescript", "react", "react-query"],
        "patterns": ["cache invalidation", "mutation side effect", "optimistic update"],
        "hypotheses": ["Missing onSuccess invalidation"],
        "attempts": [
            {"hypothesis": "No invalidation on mutation", "action": "Added queryClient.invalidateQueries(['experiences']) in onSuccess", "result": "passed", "evidence": "List refreshes immediately after mutation"}
        ],
        "failed_approaches": ["Setting staleTime to 0", "Manual window.location.reload"],
        "successful_approach": "Added invalidateQueries in the mutation's onSuccess callback",
        "root_cause": "React Query caches query results; mutations don't automatically invalidate related queries",
        "solution": "useMutation({ mutationFn: ..., onSuccess: () => queryClient.invalidateQueries({ queryKey: ['experiences'] }) })",
        "verification": {"passed": 6, "failed": 0},
        "lesson": "Always pair mutations with query invalidation for related data. Consider optimistic updates for better UX.",
        "recommended_next_action": "Review all mutations and ensure onSuccess invalidates the relevant query keys",
        "confidence": 0.88, "project": "frontend-project", "source": "seed",
    },

    # ── Universal scope (3 universal patterns) ────────────────────────────
    {
        "scope": "universal", "title": "UNIVERSAL: Check error message before googling",
        "problem_summary": "Wasted time searching when the exact error message in the terminal or logs contained the fix in the next line.",
        "symptoms": ["error message ignored", "root cause in logs", "spent time on wrong fix"],
        "error_codes": [],
        "context": {"language": "", "framework": [], "libraries": [], "env": "any"},
        "category": "other",
        "technologies": [],
        "patterns": ["read the error", "log inspection", "first principles debugging"],
        "hypotheses": [],
        "attempts": [],
        "failed_approaches": ["Immediately googling the error", "Asking AI without reading logs"],
        "successful_approach": "Read the full error message, traceback, and surrounding log lines before taking action",
        "root_cause": "Jumping to solutions without understanding the error",
        "solution": "Always read the full error message and stack trace. The fix is often in the next line after the error.",
        "verification": {"passed": 0, "failed": 0},
        "lesson": "Read the error. The full error message, traceback, and the lines immediately before it contain the most important diagnostic signal. Don't skip to Google.",
        "recommended_next_action": "Before searching or asking AI: read the complete traceback and identify the first line that is YOUR code, not a library",
        "confidence": 0.98, "project": "", "source": "seed",
    },
    {
        "scope": "universal", "title": "UNIVERSAL: Isolate before fixing — minimal reproduction",
        "problem_summary": "Bug was in a complex integration. Spent hours before isolating to a 5-line reproduction that made the fix obvious.",
        "symptoms": ["bug hard to locate", "too many variables", "intermittent failure"],
        "error_codes": [],
        "context": {"language": "", "framework": [], "libraries": [], "env": "any"},
        "category": "other",
        "technologies": [],
        "patterns": ["minimal reproduction", "isolation", "binary search debugging"],
        "hypotheses": [],
        "attempts": [],
        "failed_approaches": ["Debugging in the full application", "Adding logs everywhere", "Guessing and checking"],
        "successful_approach": "Created a minimal script that reproduced the issue in isolation, then fixed it",
        "root_cause": "Debugging in complex context hides the actual failure mechanism",
        "solution": "Create the smallest possible code that reproduces the bug. Remove everything until the bug disappears — the last thing removed is the cause.",
        "verification": {"passed": 0, "failed": 0},
        "lesson": "Isolate the bug first. Build the smallest reproduction. Binary search through your code if needed. Isolation makes the fix obvious.",
        "recommended_next_action": "Write a standalone script that reproduces the issue with no external dependencies",
        "confidence": 0.97, "project": "", "source": "seed",
    },
    {
        "scope": "universal", "title": "UNIVERSAL: Check what changed last before debugging",
        "problem_summary": "Bug appeared after a deploy. Spent 2 hours debugging before realizing a config change from that morning was the cause.",
        "symptoms": ["sudden regression", "worked before", "no code change visible"],
        "error_codes": [],
        "context": {"language": "", "framework": [], "libraries": [], "env": "any"},
        "category": "other",
        "technologies": [],
        "patterns": ["recent change", "regression hunting", "git bisect", "config drift"],
        "hypotheses": [],
        "attempts": [],
        "failed_approaches": ["Debugging the code that 'should work'", "Assuming the code is the problem"],
        "successful_approach": "Checked git log, deployment history, and config changes first — found a mismatched env variable",
        "root_cause": "Bugs often accompany changes. The most recent change is the most likely culprit.",
        "solution": "Run 'git log --oneline -20', check deployment logs, review config changes. Revert the last change and see if bug disappears.",
        "verification": {"passed": 0, "failed": 0},
        "lesson": "When debugging a regression: check what changed last. git blame, git log, and deployment history are your first tools.",
        "recommended_next_action": "Run 'git log --oneline' and 'git diff HEAD~1' before doing anything else",
        "confidence": 0.96, "project": "", "source": "seed",
    },
]


def run_seed():
    init_db()
    conn = get_conn()
    existing = conn.execute("SELECT COUNT(*) FROM experiences WHERE source='seed'").fetchone()[0]
    if existing >= len(EXPERIENCES):
        print(f"[seed] Already seeded ({existing} experiences). Skipping.")
        conn.close()
        return

    print(f"[seed] Inserting {len(EXPERIENCES)} experiences and computing embeddings…")
    inserted = 0
    for exp in EXPERIENCES:
        # Build embedding text from the most semantically rich fields
        embed_text = " ".join([
            exp["problem_summary"],
            " ".join(exp.get("symptoms", [])),
            exp.get("lesson", ""),
            " ".join(exp.get("patterns", [])),
        ])
        vec = embed(embed_text)
        blob = to_blob(vec)

        conn.execute("""
            INSERT INTO experiences
              (scope, title, problem_summary, symptoms, error_codes, context,
               category, technologies, patterns, hypotheses, attempts,
               failed_approaches, successful_approach, root_cause, solution,
               verification, lesson, recommended_next_action, confidence,
               project, source, embedding)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            exp["scope"], exp["title"], exp["problem_summary"],
            json.dumps(exp.get("symptoms", [])),
            json.dumps(exp.get("error_codes", [])),
            json.dumps(exp.get("context", {})),
            exp["category"],
            json.dumps(exp.get("technologies", [])),
            json.dumps(exp.get("patterns", [])),
            json.dumps(exp.get("hypotheses", [])),
            json.dumps(exp.get("attempts", [])),
            json.dumps(exp.get("failed_approaches", [])),
            exp.get("successful_approach", ""),
            exp.get("root_cause", ""),
            exp.get("solution", ""),
            json.dumps(exp.get("verification", {})),
            exp.get("lesson", ""),
            exp.get("recommended_next_action", ""),
            float(exp.get("confidence", 0.0)),
            exp.get("project", ""),
            exp["source"],
            blob,
        ))
        inserted += 1
        print(f"  [{inserted}/{len(EXPERIENCES)}] {exp['title'][:60]}")

    conn.commit()
    conn.close()
    print(f"[seed] Done. {inserted} experiences seeded.")


if __name__ == "__main__":
    run_seed()
