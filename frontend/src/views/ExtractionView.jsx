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
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
          Session <span className="gradient-text">Extraction</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Observe real-time raw event streams reduce down into 1 high-value structured debugging memory.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Raw Log Buffer */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
              Raw Session Buffer (187 Raw Events)
            </h3>
            <button onClick={() => setRawText(SAMPLE_LOG)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              Load Sample Log
            </button>
          </div>

          <textarea
            className="input-field"
            style={{ flex: 1, minHeight: '300px', marginBottom: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw terminal output, lint diagnostics, or test runner output..."
          />

          <button
            onClick={handleExtract}
            disabled={extracting || !rawText.trim()}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {extracting ? (
              <>Extracting Experience...</>
            ) : (
              <>
                <Zap size={16} /> Trigger Extraction Pipeline
              </>
            )}
          </button>
        </div>

        {/* Extracted Experience Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
            Extracted Structured Experience (Click box for floating bar)
          </h3>

          {error && (
            <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(251, 113, 133, 0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', marginBottom: '14px' }}>
              <AlertCircle size={16} style={{ marginBottom: '4px' }} />
              <p style={{ fontSize: '0.85rem' }}>{error}</p>
            </div>
          )}

          {!result && !extracting && (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '2px dashed var(--border-glass)', borderRadius: '10px', padding: '16px', color: 'var(--text-subtle)' }}>
              <Zap size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.82rem' }}>Click "Trigger Extraction Pipeline" to compress raw session logs into structured learning.</p>
            </div>
          )}

          {result && (
            <div
              className="glass-panel-interactive"
              style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
              onClick={() => setActiveModalItem(result.experience)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} /> Extracted via {result.source_used} engine
                </span>
                <span className="badge badge-cyan">{result.experience.category}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Problem Summary</span>
                <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginTop: '2px' }}>
                  {result.experience.problem_summary}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>Successful Fix</span>
                <div style={{ background: 'rgba(52, 211, 153, 0.08)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', color: '#a7f3d0', marginTop: '2px' }}>
                  {result.experience.successful_approach}
                </div>
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                <span>Inspect in Floating Bar <ArrowRight size={13} /></span>
              </div>
            </div>
          )}

        </div>

      </div>

      <QuickDetailModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}
