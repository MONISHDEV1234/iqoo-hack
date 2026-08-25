import React from 'react';
import {
  LayoutDashboard, Database, Zap, Search, Bot,
  Cpu, X, Sun, Moon, Wifi, WifiOff,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',        icon: LayoutDashboard, desc: 'Stats & recent activity' },
  { id: 'vault',      label: 'Experience Vault',  icon: Database,        desc: 'Search indexed memories' },
  { id: 'extraction', label: 'Session Extract',   icon: Zap,             desc: 'Compress debug logs' },
  { id: 'retrieval',  label: 'Retrieval & AI',    icon: Search,          desc: 'Hybrid scoring & LLM test' },
  { id: 'coach',      label: 'Coach & Patterns',  icon: Bot,             desc: 'AI coach from your vault' },
];

export function SlidingDrawer({ activeTab, setActiveTab, isOpen, onClose, isConnected, theme, toggleTheme }) {
  return (
    <>
      {/* Backdrop */}
      <div
        id="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'absolute',   /* scoped to .mobile-shell, not the viewport */
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 300,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* Drawer panel */}
      <aside
        id="sliding-drawer"
        style={{
          position: 'absolute',   /* scoped inside .mobile-shell */
          top: 0,
          left: 0,
          bottom: 0,
          width: '78%',
          maxWidth: '300px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border-glass)',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.30s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '4px 0 40px rgba(0,0,0,0.5)' : 'none',
          overflowY: 'auto',
        }}
      >

        {/* Drawer header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border-glass)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Cpu size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                Sentinel
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Experience Engine
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            id="drawer-close-btn"
            onClick={onClose}
            style={{
              background: 'rgba(148,163,184,0.1)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav section label */}
        <div style={{ padding: '14px 16px 6px' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 }}>
            Navigation
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {NAV_ITEMS.map(({ id, label, desc, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                id={`drawer-nav-${id}`}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(37,99,235,0.15))'
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  width: '100%',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Active left accent bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: '20%', bottom: '20%',
                    width: '3px',
                    background: 'linear-gradient(180deg, #ef4444, #3b82f6)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}

                {/* Icon box */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                  background: isActive
                    ? 'linear-gradient(135deg, #ef4444, #2563eb)'
                    : 'rgba(148,163,184,0.08)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border-glass)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s ease',
                }}>
                  <Icon
                    size={17}
                    style={{ color: isActive ? '#fff' : 'var(--text-subtle)', transition: 'color 0.18s ease' }}
                  />
                </div>

                {/* Label + desc */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-display)',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.18s ease',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-subtle)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '1px',
                  }}>
                    {desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Connection status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px',
            background: isConnected
              ? 'rgba(96, 165, 250, 0.08)'
              : 'rgba(239, 68, 68, 0.08)',
            borderRadius: '10px',
            border: `1px solid ${isConnected ? 'rgba(96,165,250,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {isConnected
              ? <Wifi size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
              : <WifiOff size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
            }
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {isConnected ? 'API Core Online' : 'API Core Offline'}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-subtle)' }}>
                localhost:8000
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            id="drawer-theme-btn"
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              background: 'rgba(148,163,184,0.06)',
              border: '1px solid var(--border-glass)',
              cursor: 'pointer', color: 'var(--text-main)',
              fontSize: '0.84rem', fontWeight: 500,
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s ease',
              width: '100%', textAlign: 'left',
            }}
          >
            {theme === 'dark'
              ? <><Sun size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} /> Light Mode</>
              : <><Moon size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} /> Dark Mode</>
            }
          </button>
        </div>

      </aside>
    </>
  );
}
