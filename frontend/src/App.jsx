import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { VaultView } from './views/VaultView';
import { ExtractionView } from './views/ExtractionView';
import { RetrievalView } from './views/RetrievalView';
import { CoachView } from './views/CoachView';
import { api } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getDashboardStats();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'vault':
        return <VaultView />;
      case 'extraction':
        return <ExtractionView />;
      case 'retrieval':
        return <RetrievalView />;
      case 'coach':
        return <CoachView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)', transition: 'background-color 0.3s ease' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isConnected={isConnected}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div
        style={{
          marginLeft: isCollapsed ? '68px' : '260px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Header
          activeTab={activeTab}
          isConnected={isConnected}
        />
        <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
