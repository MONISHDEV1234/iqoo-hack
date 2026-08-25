import React from 'react';
import { Cpu } from 'lucide-react';

export function Header({ activeTab, isConnected }) {
  const titles = {
    dashboard: 'System Dashboard & Telemetry',
    vault: 'Experience Vault & Search',
    extraction: 'Real-Time Session Event Extractor',
    retrieval: 'Hybrid Scoring & AI Memory Test',
    coach: 'Debugging Coach & Pattern Analytics',
  };

  return (
    <header
      style={{
        height: '60px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
          <span>MistakeMemo</span>
          <span>/</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'capitalize' }}>{activeTab}</span>
        </div>

        <span style={{ color: 'var(--border-glass)' }}>|</span>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {titles[activeTab]}
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.75rem', color: 'var(--text-muted)',
          background: 'rgba(148, 163, 184, 0.08)', padding: '5px 12px',
          borderRadius: '20px', border: '1px solid var(--border-glass)'
        }}>
          <Cpu size={14} style={{ color: 'var(--accent-purple)' }} />
          <span>SQLite + FTS5</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.78rem', background: 'rgba(148, 163, 184, 0.08)',
          padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--border-glass)'
        }}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 500 }}>
            {isConnected ? 'FastAPI Core (8000)' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
