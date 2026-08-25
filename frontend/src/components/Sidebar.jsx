import React from 'react';
import { LayoutDashboard, Database, Zap, Search, Bot, Cpu, PanelLeftClose, Sun, Moon } from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, isConnected, theme, toggleTheme }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Experience Vault', icon: Database },
    { id: 'extraction', label: 'Session Extract', icon: Zap },
    { id: 'retrieval', label: 'Retrieval & AI Test', icon: Search },
    { id: 'coach', label: 'Coach & Patterns', icon: Bot },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: isCollapsed ? '68px' : '260px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-glass)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: isCollapsed ? '16px 10px' : '20px 16px',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar Header & Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-glass)'
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              flexShrink: 0
            }}>
              <Cpu size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1.1rem', lineHeight: '1.1', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>MistakeMemo</h2>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                Experience Engine
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        >
          <PanelLeftClose size={18} style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: isCollapsed ? '12px' : '10px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-glow)' : 'transparent',
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div style={{
        paddingTop: '14px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            padding: isCollapsed ? '10px' : '8px 12px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} style={{ color: 'var(--accent-amber)' }} />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: 'var(--accent-purple)' }} />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            {!isCollapsed && (
              <span style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 500 }}>
                {isConnected ? 'Core Online' : 'Core Offline'}
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
