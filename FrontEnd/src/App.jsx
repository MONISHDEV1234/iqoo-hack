import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StackTrace from './components/StackTrace';
import CodeContext from './components/CodeContext';
import Analysis from './components/Analysis';
import PastSolutions from './components/PastSolutions';

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
        {activeTab === 'live-debugger' && (
          <>
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
                {/* Relevant Past Solutions Matches list */}
                <PastSolutions />
              </div>
            </div>
          </>
        )}

        {/* Dynamic Memory Vault View */}
        {activeTab === 'memory-vault' && (
          <div className="tab-pane-container">
            <h2 className="pane-title">Memory Vault</h2>
            <p className="pane-subtitle">Inspect your stored variables, cached sessions, and active memory items in real-time.</p>
            <div className="vault-grid">
              <div className="vault-item">
                <div className="vault-item-header">
                  <span className="vault-key">session_token</span>
                  <span className="vault-tag active-tag">Active</span>
                </div>
                <div className="vault-value">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfMGExMmIzcDRj...</div>
                <div className="vault-footer">Expires in 2 hours • 1.2 KB</div>
              </div>
              <div className="vault-item">
                <div className="vault-item-header">
                  <span className="vault-key">oauth_state_rand</span>
                  <span className="vault-tag secure-tag">Secured</span>
                </div>
                <div className="vault-value">8f9cad0e1f2031a2f082d72a2b2b3c4d5e6f7a...</div>
                <div className="vault-footer">Expires in 15 minutes • 256 B</div>
              </div>
              <div className="vault-item">
                <div className="vault-item-header">
                  <span className="vault-key">user_metadata</span>
                  <span className="vault-tag active-tag">Active</span>
                </div>
                <div className="vault-value">{"{ id: 'usr_02', role: 'admin', privileges: ['read', 'write'] }"}</div>
                <div className="vault-footer">Persistent cache • 512 B</div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Historical Logs View */}
        {activeTab === 'history' && (
          <div className="tab-pane-container">
            <h2 className="pane-title">Error History</h2>
            <p className="pane-subtitle">Review historical logs of issues detected and fixed by MemCode on this codebase.</p>
            <div className="history-table">
              <div className="history-row header-row">
                <div>Error Type</div>
                <div>Location</div>
                <div>Status</div>
                <div>Date Detected</div>
              </div>
              <div className="history-row">
                <div className="err-type">TypeError: Cannot read properties of undefined</div>
                <div className="err-loc font-mono">oauth2.service.ts:142</div>
                <div><span className="badge-status pending">Needs Review</span></div>
                <div className="err-date">Today, 3:15 PM</div>
              </div>
              <div className="history-row">
                <div className="err-type">AxiosError: Request failed with status code 401</div>
                <div className="err-loc font-mono">api.interceptor.ts:48</div>
                <div><span className="badge-status resolved">Resolved</span></div>
                <div className="err-date">2 weeks ago</div>
              </div>
              <div className="history-row">
                <div className="err-type">ReferenceError: secretToken is not defined</div>
                <div className="err-loc font-mono">auth.controller.ts:80</div>
                <div><span className="badge-status resolved">Resolved</span></div>
                <div className="err-date">3 months ago</div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Settings View */}
        {activeTab === 'settings' && (
          <div className="tab-pane-container">
            <h2 className="pane-title">Debugger Settings</h2>
            <p className="pane-subtitle">Configure backend connections, LLM parameters, and commit behaviors.</p>
            <div className="settings-form">
              <div className="settings-group">
                <label className="settings-label">Active AI Model</label>
                <select className="settings-input-select">
                  <option>MemCode Resnet-Pro (Default)</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>GPT-4o Debugger</option>
                  <option>Local DeepSeek Coder 7B</option>
                </select>
              </div>
              <div className="settings-group toggle-group">
                <div>
                  <div className="settings-label">Auto-Commit Resolution</div>
                  <div className="setting-description">Automatically run git add/commit when a fix operates successfully in live dev.</div>
                </div>
                <input type="checkbox" className="settings-checkbox" defaultChecked />
              </div>
              <div className="settings-group toggle-group">
                <div>
                  <div className="settings-label">Run Tests Intercept</div>
                  <div className="setting-description">Run npm test automatically on staging server before applying fix.</div>
                </div>
                <input type="checkbox" className="settings-checkbox" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
