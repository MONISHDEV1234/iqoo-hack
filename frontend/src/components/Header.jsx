import React from 'react';
import { Cpu, Sun, Moon, Menu } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  vault: 'Experience Vault',
  extraction: 'Session Extract',
  retrieval: 'Retrieval & AI',
  coach: 'Coach & Patterns',
};

export function MobileTopBar({ activeTab, isConnected, theme, toggleTheme, onMenuClick }) {
  return (
    <header className="mobile-topbar">

      {/* Left: hamburger + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Hamburger */}
        <button
          id="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '8px',
            transition: 'background 0.2s ease',
          }}
        >
          <Menu size={22} />
        </button>

        {/* Logo icon */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'linear-gradient(135deg, #ef4444, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Cpu size={16} color="#fff" />
        </div>

        {/* Page title */}
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1 }}>
            Sentinel
          </div>
          <h1 style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
            {PAGE_TITLES[activeTab] || activeTab}
          </h1>
        </div>
      </div>

      {/* Right: status + theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span>{isConnected ? 'Online' : 'Offline'}</span>
        </div>

        <button
          id="topbar-theme-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          style={{
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease',
          }}
        >
          {theme === 'dark'
            ? <Sun size={15} style={{ color: 'var(--accent-amber)' }} />
            : <Moon size={15} style={{ color: 'var(--accent-purple)' }} />
          }
        </button>
      </div>
    </header>
  );
}
