import React, { useState } from 'react';
import { api } from '../api/client';
import { Zap, FileText, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { QuickDetailModal } from '../components/QuickDetailModal';

const SAMPLE_LOG = `[2026-08-25T12:00:01] $ pytest tests/test_auth.py
============================= TEST FAILURES =============================
____________________________ test_jwt_verify ____________________________
tests/test_auth.py:42: in test_jwt_verify
    assert decoded["sub"] == "user123"
E   jwt.exceptions.DecodeError: Signature verification failed
========================= 1 failed in 0.45s =========================

[2026-08-25T12:01:10] File saved: app/auth.py (python)
[2026-08-25T12:01:15] Diagnostic Pyright: "SECRET_KEY" variable used before assignment
[2026-08-25T12:02:40] $ pytest tests/test_auth.py
========================= 1 passed in 0.12s =========================`;

export function ExtractionView() {
  const [rawText, setRawText] = useState(SAMPLE_LOG);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeModalItem, setActiveModalItem] = useState(null);

  const handleExtract = async () => {
    setExtracting(true);
    setError(null);
    try {
      const res = await api.extractSession({
        raw_text: rawText,
        project: 'demo-workspace',
        workspace: 'd:/demo/workspace',
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div>
        <h2 className="view-title">Session <span className="gradient-text">Extraction</span></h2>
        <p className="view-subtitle">Compress raw session logs into one structured debug memory</p>
      </div>

      {/* Raw Log Input */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} style={{ color: 'var(--accent-cyan)' }} />
            Raw Session Buffer
          </h3>
          <button
            id="extraction-load-sample-btn"
            onClick={() => setRawText(SAMPLE_LOG)}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.72rem' }}
          >
            Load Sample
          </button>
        </div>

        <textarea
          id="extraction-raw-input"
          className="input-field"
          style={{ minHeight: '220px', fontSize: '0.78rem', lineHeight: '1.5' }}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste terminal output, lint diagnostics, or test runner logs..."
        />

        <button
          id="extraction-trigger-btn"
          onClick={handleExtract}
          disabled={extracting || !rawText.trim()}
          className="btn btn-primary btn-full"
        >
          {extracting ? (
            <>Extracting Experience...</>
          ) : (
            <><Zap size={16} /> Trigger Extraction Pipeline</>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(251,113,133,0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.82rem' }}>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!result && !extracting && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', border: '2px dashed var(--border-glass)', borderRadius: '12px', color: 'var(--text-subtle)', textAlign: 'center', gap: '10px' }}>
          <Zap size={32} style={{ opacity: 0.25 }} />
          <p style={{ fontSize: '0.8rem' }}>Tap "Trigger Extraction Pipeline" to compress logs into structured learning.</p>
        </div>
      )}

      {/* Extracted Result */}
      {result && (
        <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} style={{ color: 'var(--accent-purple)' }} />
            Extracted Experience
          </h3>

          <div
            id="extraction-result-card"
            className="glass-panel-interactive"
            style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => setActiveModalItem(result.experience)}
          >
            {/* Success banner */}
            <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.1)', borderBottom: '1px solid rgba(52,211,153,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={14} /> Via {result.source_used} engine
              </span>
              <span className="badge badge-cyan">{result.experience.category}</span>
            </div>

            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Problem Summary</span>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem', marginTop: '3px' }}>
                  {result.experience.problem_summary}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Successful Fix</span>
                <div style={{ background: 'rgba(52,211,153,0.08)', padding: '8px 10px', borderRadius: '7px', fontSize: '0.8rem', color: '#a7f3d0', marginTop: '3px' }}>
                  {result.experience.successful_approach}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Inspect details <ArrowRight size={12} style={{ marginLeft: '3px' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <QuickDetailModal item={activeModalItem} onClose={() => setActiveModalItem(null)} />
    </div>
  );
}
