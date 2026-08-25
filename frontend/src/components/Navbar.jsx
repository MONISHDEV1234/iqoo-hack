import React from 'react';
import { LayoutDashboard, Database, Zap, Search, Bot, Cpu } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, isConnected }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Experience Vault', icon: Database },
    { id: 'extraction', label: 'Session Extract', icon: Zap },
    { id: 'retrieval', label: 'Retrieval & AI Test', icon: Search },
    { id: 'coach', label: 'Coach & Patterns', icon: Bot },
  ];

  return (
    <header style={{
      background: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glass)',
      padding: '16px 40px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
        }}>
          <Cpu size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', lineHeight: '1.1' }}>Sentinel</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Experience Engine Console
          </span>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-glow)' : 'transparent',
                background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Server Health Status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.04)',
        padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-glass)'
      }}>
        <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
        <span style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 500 }}>
          {isConnected ? 'Core Online (8000)' : 'Core Offline'}
        </span>
      </div>
    </header>
  );
}
