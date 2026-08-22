import React from 'react';

function App() {
  return (
    <div className="app-container">
      {/* Sidebar - Component Step 2 */}
      <aside className="app-sidebar">
        <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
          Sidebar Placeholder
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-frame">
        {/* Header - Component Step 3 */}
        <header className="header-container">
          <div style={{ color: 'var(--text-muted)' }}>Header Placeholder</div>
        </header>

        {/* Dashboard Split Grid */}
        <div className="dashboard-content">
          {/* Left Panel Content */}
          <div className="left-panel">
            {/* StackTrace - Component Step 4 */}
            <div className="placeholder-box">Stack Trace Placeholder</div>

            {/* CodeContext - Component Step 4 */}
            <div className="placeholder-box">Code Context Placeholder</div>

            {/* Analysis - Component Step 5 */}
            <div className="placeholder-box">MemCode Analysis Placeholder</div>
          </div>

          {/* Right Panel Content */}
          <div className="right-panel">
            {/* PastSolutions - Component Step 6 */}
            <div className="placeholder-box">Past Solutions Placeholder</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
