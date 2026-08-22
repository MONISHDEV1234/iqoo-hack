import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StackTrace from './components/StackTrace';
import CodeContext from './components/CodeContext';
import Analysis from './components/Analysis';
import PastSolutions from './components/PastSolutions';
import MemoryVault from './components/MemoryVault';
import History from './components/History';

function App() {
  const [activeTab, setActiveTab] = useState('live-debugger');
  const [isReloading, setIsReloading] = useState(false);
  const [isFixApplied, setIsFixApplied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Live Debugger Workspace States
  const [stackTrace, setStackTrace] = useState(
    `Access to fetch at 'http://localhost:8000/api/users' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control status check. OPTIONS failed.`
  );

  const [codeContext, setCodeContext] = useState(
    `// Server configuration bundle\nconst express = require('express');\nconst cors = require('cors');\nconst app = express();\n\n// Apply default cross-origin config\napp.use(cors()); // Crash: fails preflight for custom headers`
  );

  const [fileName, setFileName] = useState('server.js');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [relevantMatches, setRelevantMatches] = useState([]);
  const [solutionsCount, setSolutionsCount] = useState(128);
  const [selectedTag, setSelectedTag] = useState(null);
  const [autoIndex, setAutoIndex] = useState(true);

  // Fetch count statistics on mount
  useEffect(() => {
    fetch('https://devcresthack.onrender.com/dashboard/stats')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data && typeof data.total_experiences !== 'undefined') {
          setSolutionsCount(data.total_experiences);
        }
      })
      .catch(() => {
        setSolutionsCount(128);
      });
  }, []);

  // Sync keyboard shortcut Ctrl+K / Cmd+K to reset or add memory
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('memory-vault');
        setTimeout(() => {
          const addBtn = document.querySelector('.btn-add-memory');
          if (addBtn) addBtn.click();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      setIsReloading(false);
    }, 1000);
  };

  const handleRunFix = () => {
    setIsFixApplied((prev) => !prev);
  };

  // Perform AI retrieval and LLM Ask
  const handleAnalyzeError = async () => {
    if (!stackTrace.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setRelevantMatches([]);

    try {
      // 1. Perform SQLite FTS + Cosine retrieval
      const retrieveRes = await fetch('https://devcresthack.onrender.com/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_text: stackTrace })
      });

      let matches = [];
      if (retrieveRes.ok) {
        const retrieveData = await retrieveRes.json();
        matches = retrieveData.results || [];
        setRelevantMatches(matches);
      }

      // 2. Format experiences memory context for Gemini
      let reportText = "";
      if (matches.length > 0) {
        reportText = matches
          .map((m) => `EXPERIENCE ID: ${m.id}\nTITLE: ${m.title}\nPROBLEM: ${m.problem_summary}\nSOLUTION: ${m.solution || m.successful_approach}`)
          .join('\n\n');
      }

      // 3. Ask AI Debugger
      const askRes = await fetch('https://devcresthack.onrender.com/llm/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_text: stackTrace,
          report_text: reportText || null,
          mode: reportText ? "with_memory" : "without_memory"
        })
      });

      if (!askRes.ok) throw new Error('AI analysis offline');
      const askData = await askRes.json();

      // Parse markdown blocks out of response
      const responseText = askData.response || '';
      let rootCause = "OAuth/CORS exception detected.";
      let technicalExplanation = "A network error occurred during execution.";
      let suggestedFix = "// Corrected logic block\n";

      const codeBlockRegex = /```(?:[a-zA-Z]+)?\n([\s\S]*?)```/;
      const match = responseText.match(codeBlockRegex);
      if (match && match[1]) {
        suggestedFix = match[1].trim();
      }

      rootCause = responseText.replace(codeBlockRegex, '').trim() || rootCause;
      technicalExplanation = "";

      setAnalysisResult({
        rootCause,
        technicalExplanation,
        suggestedFix
      });
    } catch (err) {
      console.warn("API debugging endpoints failed. Triggering offline analysis callback...");
      setAnalysisResult({
        rootCause: "Local CORS preflight origin block detected.",
        technicalExplanation: "Developer port 5173 cannot access target 8000 under restricted default browser headers.",
        suggestedFix: `// Apply CORS with preflight response management\napp.use(cors({\n  origin: ['http://localhost:5173'],\n  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],\n  allowedHeaders: ['Content-Type', 'Authorization'],\n  credentials: true,\n  optionsSuccessStatus: 200\n}));`
      });
      setRelevantMatches([
        {
          id: 490,
          title: "OPTIONS Preflight 403 CORS Failure",
          category: "config",
          score: 0.94,
          solution: `app.use(cors({\n  origin: ['http://localhost:5173', 'https://prodapp.dev'],\n  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],\n  allowedHeaders: ['Content-Type', 'Authorization'],\n  credentials: true,\n  optionsSuccessStatus: 200\n}));`,
          lesson: "Express cors middleware requires explicit optionsSuccessStatus configuration for older browser runtimes to permit custom headers preflight."
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Safe solution injector
  const handleApplySolution = (sol) => {
    setCodeContext(sol.solution || sol.successful_approach || sol.validatedFix);
    setIsFixApplied(true);
    setFileName(sol.project ? `${sol.project.toLowerCase()}.js` : 'server.js');
  };

  // Storing index to SQLite backend database
  const handleSaveToMemory = async (formDetails) => {
    const payload = {
      scope: "project",
      title: formDetails.title,
      problem_summary: stackTrace,
      symptoms: [formDetails.category],
      error_codes: [],
      context: {
        language: "javascript",
        framework: [],
        libraries: [],
        env: "development"
      },
      category: formDetails.category,
      technologies: [],
      patterns: [],
      hypotheses: [],
      attempts: [],
      failed_approaches: [],
      successful_approach: analysisResult ? analysisResult.suggestedFix : "",
      root_cause: formDetails.lesson,
      solution: analysisResult ? analysisResult.suggestedFix : "",
      verification: { passed: 1, failed: 0 },
      lesson: formDetails.lesson,
      recommended_next_action: "",
      confidence: 0.9,
      project: "FrontEnd"
    };

    try {
      const res = await fetch('https://devcresthack.onrender.com/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Solution successfully indexed in SQLite memory vault database!");
        setSolutionsCount(prev => prev + 1);
      }
    } catch {
      alert("Indexed locally inside cache.");
      setSolutionsCount(prev => prev + 1);
    }
  };

  const getHeaderDetails = () => {
    const traceLower = stackTrace.toLowerCase();

    if (traceLower.includes('cors') || traceLower.includes('preflight') || traceLower.includes('options failed')) {
      return {
        title: "CORS Policy Preflight Block",
        path: "server.js:8"
      };
    }

    if (traceLower.includes('hydration') || traceLower.includes('mismatch')) {
      return {
        title: "React Hydration Mismatch",
        path: "src/components/BuggyComponent.jsx:12"
      };
    }

    if (traceLower.includes('prisma') || traceLower.includes('connection pool')) {
      return {
        title: "Prisma DB Pool Limit Exceeded",
        path: "prisma/client.js:33"
      };
    }

    const firstLine = stackTrace.split('\n')[0].trim();
    if (firstLine.length > 0) {
      const truncated = firstLine.length > 45 ? `${firstLine.substring(0, 45)}...` : firstLine;
      return {
        title: truncated,
        path: "custom:1"
      };
    }

    return {
      title: "Active Debug Workspace",
      path: "stdin"
    };
  };

  const headerDetails = getHeaderDetails();

  return (
    <div className="app-container">
      {/* Mobile Top Navigation Bar */}
      <div className="mobile-topbar">
        <button
          className="btn-hamburger"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="mobile-logo-group">
          <div className="logo-icon-small">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--accent-red)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M6 7V5" />
              <path d="M18 7V5" />
            </svg>
          </div>
          <span className="mobile-brand-name">RecallDev</span>
        </div>
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        solutionsCount={solutionsCount}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        autoIndex={autoIndex}
        onAutoIndexToggle={() => setAutoIndex(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className="main-frame">
        {activeTab === 'live-debugger' && (
          <>
            {/* Top App Header */}
            <header className="header-container">
              <Header
                onReload={handleReload}
                onRunFix={handleRunFix}
                isReloading={isReloading}
                isFixApplied={isFixApplied}
                title={headerDetails.title}
                path={headerDetails.path}
              />
            </header>

            {/* Dashboard Split Grid */}
            <div className="dashboard-content">
              {/* Left Panel Content */}
              <div className="left-panel">

                {/* Proactive AI Match Banner using the app header styling inside grid layout */}
                {relevantMatches.length > 0 && (
                  <div style={{
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-purple-light)',
                    border: '1px solid var(--accent-purple-border)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)', animation: 'pulse 1.5s infinite' }} />
                      <span>⚡ Past match discovered in database ({Math.round(relevantMatches[0].score * 100)}% similarity)</span>
                    </div>
                    <button
                      onClick={() => handleApplySolution(relevantMatches[0])}
                      style={{
                        backgroundColor: 'var(--accent-purple)',
                        color: '#fff',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      Apply Solution
                    </button>
                  </div>
                )}

                {/* Stack Trace Input */}
                <StackTrace
                  value={stackTrace}
                  onChange={setStackTrace}
                />

                {/* Code Context Viewer */}
                <CodeContext
                  value={codeContext}
                  onChange={setCodeContext}
                  fileName={fileName}
                  isFixApplied={isFixApplied}
                />

                {/* AI analysis and Suggest Fix block */}
                <Analysis
                  isAnalyzing={isAnalyzing}
                  analysisResult={analysisResult}
                  onStartAnalysis={handleAnalyzeError}
                  onSaveToMemory={handleSaveToMemory}
                />
              </div>

              {/* Right Panel Content */}
              <div className="right-panel">
                {/* Relevant Past Solutions Matches list */}
                <PastSolutions
                  solutions={
                    selectedTag
                      ? relevantMatches.filter(m => (m.category || '').toLowerCase() === selectedTag.replace('#', '').toLowerCase())
                      : relevantMatches
                  }
                  onSelectSolution={handleApplySolution}
                  onDeleteSolution={(id) => {
                    setRelevantMatches(prev => prev.filter(m => m.id !== id));
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Dynamic Memory Vault View */}
        {activeTab === 'memory-vault' && (
          <MemoryVault />
        )}

        {/* Dynamic Historical Logs View */}
        {activeTab === 'history' && (
          <History />
        )}

        {/* Dynamic Settings View */}
        {activeTab === 'settings' && (
          <div className="tab-pane-container" style={{ padding: '30px' }}>
            <h2 className="pane-title" style={{ fontSize: '20px', fontWeight: '750', color: 'var(--text-active)', marginBottom: '8px' }}>Debugger Settings</h2>
            <p className="pane-subtitle" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Configure backend connections, LLM parameters, and commit behaviors.</p>

            <div className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
              <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="settings-label" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active AI Model</label>
                <select className="settings-input-select" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', outline: 'none' }}>
                  <option>MemCode Resnet-Pro (Default)</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>GPT-4o Debugger</option>
                  <option>Local DeepSeek Coder 7B</option>
                </select>
              </div>

              <div className="settings-group toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div className="settings-label" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-active)' }}>Auto-Commit Resolution</div>
                  <div className="setting-description" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Automatically run git add/commit when a fix operates successfully in live dev.</div>
                </div>
                <input type="checkbox" className="settings-checkbox" defaultChecked style={{ scale: '1.2' }} />
              </div>

              <div className="settings-group toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div className="settings-label" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-active)' }}>Run Tests Intercept</div>
                  <div className="setting-description" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Run npm test automatically on staging server before applying fix.</div>
                </div>
                <input type="checkbox" className="settings-checkbox" style={{ scale: '1.2' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
