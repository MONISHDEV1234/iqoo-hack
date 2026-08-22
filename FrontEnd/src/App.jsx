import React, { useState } from 'react';
import Sidebar from './components/Sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('live-debugger');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

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
