import React, { useState, useEffect } from 'react';
import { MobileTopBar } from './components/Header';
import { SlidingDrawer } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { VaultView } from './views/VaultView';
import { ExtractionView } from './views/ExtractionView';
import { RetrievalView } from './views/RetrievalView';
import { CoachView } from './views/CoachView';
import { api } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getDashboardStats();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = (tab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':  return <DashboardView />;
      case 'vault':      return <VaultView />;
      case 'extraction': return <ExtractionView />;
      case 'retrieval':  return <RetrievalView />;
      case 'coach':      return <CoachView />;
      default:           return <DashboardView />;
    }
  };

  return (
    <div className="app-wrapper">
      <div className="mobile-shell">

        {/* Sliding drawer */}
        <SlidingDrawer
          activeTab={activeTab}
          setActiveTab={handleNav}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          isConnected={isConnected}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Top bar — hamburger opens drawer */}
        <MobileTopBar
          activeTab={activeTab}
          isConnected={isConnected}
          theme={theme}
          toggleTheme={toggleTheme}
          onMenuClick={() => setDrawerOpen(true)}
        />

        {/* Main scrollable content — no bottom nav padding */}
        <main className="mobile-content" id="main-content">
          {renderView()}
        </main>

      </div>
    </div>
  );
}

export default App;
