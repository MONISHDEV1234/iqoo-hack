import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StackTrace from './components/StackTrace';
import CodeContext from './components/CodeContext';
import Analysis from './components/Analysis';

function App() {
  const [activeTab, setActiveTab] = useState('live-debugger');
  const [isReloading, setIsReloading] = useState(false);
  const [isFixApplied, setIsFixApplied] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      setIsReloading(false);
    }, 1000);
  };

  const handleRunFix = () => {
    setIsFixApplied((prev) => !prev);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-frame">
        {/* Top App Header */}
        <header className="header-container">
          <Header
            onReload={handleReload}
            onRunFix={handleRunFix}
            isReloading={isReloading}
            isFixApplied={isFixApplied}
          />
        </header>

        {/* Dashboard Split Grid */}
        <div className="dashboard-content">
          {/* Left Panel Content */}
          <div className="left-panel">
            {/* Stack Trace Input */}
            <StackTrace />

            {/* Code Context Viewer */}
            <CodeContext isFixApplied={isFixApplied} />

            {/* AI analysis and Suggest Fix block */}
            <Analysis />
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
