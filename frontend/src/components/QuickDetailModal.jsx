import React from 'react';
import { X, AlertTriangle, CheckCircle, Lightbulb, Zap, Tag, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';

export function QuickDetailModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Bar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple">{item.category || 'Debug Experience'}</span>
              <span className="badge badge-cyan">{item.scope || 'Project'}</span>
              {item.source && <span className="badge badge-emerald">Source: {item.source}</span>}
              {item.confidence && (
                <span className="badge badge-cyan" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
                  Confidence: {Math.round(item.confidence * 100)}%
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.3rem', color: '#fff', lineHeight: '1.3' }}>
              {item.id ? `#${item.id} — ` : ''}{item.title || item.problem_summary || 'Experience Details'}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              color: 'var(--text-muted)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Short Summary Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(192, 132, 252, 0.1))',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Zap size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block' }}>
              Work Summary
            </span>
            <p style={{ fontSize: '0.86rem', color: '#e2e8f0', margin: 0 }}>
              {item.problem_summary}
            </p>
          </div>
        </div>

        {/* Details Breakdown Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Error Codes & Symptoms */}
          {((item.error_codes && item.error_codes.length > 0) || (item.symptoms && item.symptoms.length > 0)) && (
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Captured Signals & Error Codes
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Array.isArray(item.error_codes) && item.error_codes.map((code, idx) => (
                  <span key={idx} className="badge badge-rose">{code}</span>
                ))}
                {Array.isArray(item.symptoms) && item.symptoms.map((sym, idx) => (
                  <span key={idx} className="badge badge-emerald">{sym}</span>
                ))}
              </div>
            </div>
          )}

          {/* Failed Approaches */}
          {item.failed_approaches && (
            <div>
              <h4 style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '4px' }}>
                <AlertTriangle size={15} /> Failed Approaches / Traps to Avoid
              </h4>
              <div style={{ background: 'rgba(251, 113, 133, 0.06)', border: '1px solid rgba(251, 113, 133, 0.2)', padding: '12px', borderRadius: '8px' }}>
                {Array.isArray(item.failed_approaches) && item.failed_approaches.length > 0 ? (
                  item.failed_approaches.map((approach, idx) => (
                    <p key={idx} style={{ fontSize: '0.84rem', color: '#fca5a5', marginBottom: '2px' }}>
                      • {approach}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: '0.84rem', color: '#fca5a5' }}>
                    {item.failed_approaches}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Root Cause & Solution */}
          {(item.successful_approach || item.solution || item.root_cause) && (
            <div>
              <h4 style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '4px' }}>
                <CheckCircle size={15} /> Solution & Root Cause
              </h4>
              <div style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '8px' }}>
                {item.root_cause && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-emerald)', fontSize: '0.78rem' }}>Root Cause:</span>
                    <p style={{ fontSize: '0.84rem', color: '#a7f3d0' }}>{item.root_cause}</p>
                  </div>
                )}
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--accent-emerald)', fontSize: '0.78rem' }}>Successful Fix:</span>
                  <p style={{ fontSize: '0.84rem', color: '#a7f3d0' }}>{item.successful_approach || item.solution}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reusable Lesson / Rule */}
          {(item.lesson || item.recommended_next_action) && (
            <div>
              <h4 style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '4px' }}>
                <Lightbulb size={15} /> Reusable Rule & Lesson
              </h4>
              <div style={{ background: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.2)', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', color: '#e9d5ff' }}>
                  {item.lesson || item.recommended_next_action}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
