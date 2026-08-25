import React from 'react';
import { X, AlertTriangle, CheckCircle, Lightbulb, Zap } from 'lucide-react';

export function QuickDetailModal({ item, onClose }) {
  if (!item) return null;

  return (
    /* ── Backdrop ── */
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.60)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',       /* vertically centred — like iOS popup */
        justifyContent: 'center',
        padding: '20px 16px',       /* breathing room so card doesn't touch edges */
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      {/* ── Popup card ── */}
      <div
        id="detail-popup-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',          /* phone-sized card, never wider */
          maxHeight: '78vh',          /* never takes full height */
          overflowY: 'auto',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '18px',       /* all four corners rounded — popup feel */
          border: '1px solid var(--border-glow)',
          boxShadow:
            '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(239,68,68,0.08)',
          padding: '16px',
          animation: 'popIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* ── Header row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1, marginRight: '10px' }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '7px' }}>
              <span className="badge badge-purple">{item.category || 'Debug'}</span>
              <span className="badge badge-cyan">{item.scope || 'Project'}</span>
              {item.source && <span className="badge badge-emerald">{item.source}</span>}
              {item.confidence && (
                <span className="badge badge-cyan">
                  {Math.round(item.confidence * 100)}% conf
                </span>
              )}
            </div>
            {/* Title */}
            <h2 style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.35', fontFamily: 'var(--font-display)' }}>
              {item.id ? `#${item.id} — ` : ''}
              {item.title || item.problem_summary?.slice(0, 60) || 'Experience Details'}
            </h2>
          </div>

          {/* Close ✕ */}
          <button
            id="modal-close-btn"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              color: 'var(--text-muted)',
              width: '30px', height: '30px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'var(--border-glass)', marginBottom: '12px' }} />

        {/* ── Summary banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(37,99,235,0.08))',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: '10px', padding: '10px 12px', marginBottom: '14px',
          display: 'flex', alignItems: 'flex-start', gap: '9px',
        }}>
          <Zap size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
              Summary
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
              {item.problem_summary}
            </p>
          </div>
        </div>

        {/* ── Detail sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Error codes & symptoms */}
          {((item.error_codes?.length > 0) || (item.symptoms?.length > 0)) && (
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', fontWeight: 700, display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Signals & Error Codes
              </span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {Array.isArray(item.error_codes) && item.error_codes.map((code, i) => (
                  <span key={i} className="badge badge-rose">{code}</span>
                ))}
                {Array.isArray(item.symptoms) && item.symptoms.map((sym, i) => (
                  <span key={i} className="badge badge-emerald">{sym}</span>
                ))}
              </div>
            </div>
          )}

          {/* Failed approaches */}
          {item.failed_approaches && (Array.isArray(item.failed_approaches) ? item.failed_approaches.length > 0 : true) && (
            <div>
              <h4 style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', marginBottom: '5px' }}>
                <AlertTriangle size={13} /> Failed Approaches
              </h4>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', padding: '8px 10px', borderRadius: '8px' }}>
                {Array.isArray(item.failed_approaches)
                  ? item.failed_approaches.map((a, i) => <p key={i} style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '2px' }}>• {a}</p>)
                  : <p style={{ fontSize: '0.78rem', color: '#fca5a5' }}>{item.failed_approaches}</p>
                }
              </div>
            </div>
          )}

          {/* Solution & root cause */}
          {(item.successful_approach || item.solution || item.root_cause) && (
            <div>
              <h4 style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', marginBottom: '5px' }}>
                <CheckCircle size={13} /> Solution & Root Cause
              </h4>
              <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)', padding: '8px 10px', borderRadius: '8px' }}>
                {item.root_cause && (
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.67rem', display: 'block' }}>Root Cause:</span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.root_cause}</p>
                  </div>
                )}
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.67rem', display: 'block' }}>Successful Fix:</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.successful_approach || item.solution}</p>
              </div>
            </div>
          )}

          {/* Reusable lesson */}
          {(item.lesson || item.recommended_next_action) && (
            <div>
              <h4 style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', marginBottom: '5px' }}>
                <Lightbulb size={13} /> Reusable Lesson
              </h4>
              <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {item.lesson || item.recommended_next_action}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Tap to dismiss hint ── */}
        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '14px' }}>
          Tap outside to close
        </p>
      </div>
    </div>
  );
}
