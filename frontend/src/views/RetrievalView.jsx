import React, { useState } from 'react';
import { api } from '../api/client';
import { Search, Sliders, FileText, CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { QuickDetailModal } from '../components/QuickDetailModal';

export function RetrievalView() {
  const [problemText, setProblemText] = useState('Signature verification failed in PyJWT when decoding auth header token in FastAPI');
  const [retrievalResults, setRetrievalResults] = useState(null);
  const [report, setReport] = useState('');
  const [testing, setTesting] = useState(false);
  const [withoutMemResponse, setWithoutMemResponse] = useState('');
  const [withMemResponse, setWithMemResponse] = useState('');
  const [selectedModalItem, setSelectedModalItem] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setRetrievalResults(null);
    setReport('');
    setWithoutMemResponse('');
    setWithMemResponse('');
    try {
      const ret = await api.retrieve({ problem_text: problemText });
      setRetrievalResults(ret);

      const expIds = (ret.results || []).map(r => r.id);
      const rep = await api.generateReport({
        experience_ids: expIds,
        current_problem: problemText,
        ranked_results: ret.results || [],
      });
      setReport(rep.report);

      const resWithout = await api.askLLM({ problem_text: problemText, mode: 'without_memory' });
      setWithoutMemResponse(resWithout.response);

      const resWith = await api.askLLM({ problem_text: problemText, report_text: rep.report, mode: 'with_memory' });
      setWithMemResponse(resWith.response);
    } catch (err) {
      alert(`Retrieval error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div>
        <h2 className="view-title">Retrieval & <span className="gradient-text">AI Test</span></h2>
        <p className="view-subtitle">Test hybrid scoring and compare LLM responses with/without memory</p>
      </div>

      {/* Query Input */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Problem Query
        </label>
        <input
          id="retrieval-query-input"
          type="text"
          className="input-field"
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder="Type error symptom or code issue..."
        />
        <button
          id="retrieval-execute-btn"
          onClick={handleTest}
          disabled={testing || !problemText.trim()}
          className="btn btn-primary btn-full"
        >
          {testing ? 'Running...' : <><Search size={15} /> Execute Retrieval & AI Test</>}
        </button>
      </div>

      {/* Scoring Results */}
      {(retrievalResults || testing) && (
        <div className="glass-panel" style={{ padding: '14px' }}>
          <h3 style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Sliders size={15} style={{ color: 'var(--accent-cyan)' }} />
            Scoring Inspector
          </h3>

          {testing && !retrievalResults ? (
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem' }}>Searching memory vault...</p>
          ) : retrievalResults?.results?.length === 0 ? (
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem' }}>No match above threshold (≥ 0.55).</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {retrievalResults?.results?.map((r) => (
                <div
                  key={r.id}
                  id={`retrieval-result-${r.id}`}
                  className="glass-panel-interactive"
                  style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                  onClick={() => setSelectedModalItem(r)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.84rem', flex: 1, marginRight: '8px' }}>
                      #{r.id}: {(r.title || r.problem_summary).slice(0, 38)}
                    </span>
                    <span className="badge badge-emerald" style={{ flexShrink: 0 }}>{r.score_pct || Math.round((r.score || 0) * 100)}%</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Semantic: <strong>{Math.round((r.feature_breakdown?.semantic || 0) * 100)}%</strong></span>
                    <span>Error code: <strong>{r.feature_breakdown?.error_match ? '✓' : '✗'}</strong></span>
                    <span>Framework: <strong>{Math.round((r.feature_breakdown?.framework_match || 0) * 100)}%</strong></span>
                    <span>Language: <strong>{r.feature_breakdown?.language_match ? '✓' : '✗'}</strong></span>
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    Details <ArrowRight size={11} style={{ marginLeft: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Block — collapsible */}
      {report && (
        <div className="glass-panel" style={{ padding: '14px' }}>
          <button
            onClick={() => setShowReport(v => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
          >
            <h3 style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} style={{ color: 'var(--accent-purple)' }} />
              MISTAKEMEMO_REPORT
            </h3>
            {showReport ? <ChevronUp size={16} style={{ color: 'var(--text-subtle)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-subtle)' }} />}
          </button>
          {showReport && (
            <div className="code-block" style={{ marginTop: '10px', maxHeight: '220px', overflowY: 'auto' }}>
              {report}
            </div>
          )}
        </div>
      )}

      {/* Before vs After comparison — stacked */}
      {(withoutMemResponse || withMemResponse || testing) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', textAlign: 'center' }}>
            AI <span className="gradient-text">Before vs After</span> Memory
          </h3>

          {/* Without Memory */}
          <div className="glass-panel" style={{ padding: '14px', borderTop: '3px solid var(--accent-rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <XCircle size={16} style={{ color: 'var(--accent-rose)' }} />
              <h4 style={{ fontSize: '0.88rem', color: 'var(--accent-rose)' }}>Without Memory</h4>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '10px' }}>Generic LLM — no prior context</p>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', lineHeight: '1.55', color: '#cbd5e1', whiteSpace: 'pre-wrap', maxHeight: '220px', overflowY: 'auto' }}>
              {testing ? 'Generating response without memory...' : withoutMemResponse}
            </div>
          </div>

          {/* With Memory */}
          <div className="glass-panel" style={{ padding: '14px', borderTop: '3px solid var(--accent-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
              <h4 style={{ fontSize: '0.88rem', color: 'var(--accent-emerald)' }}>With Sentinel</h4>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '10px' }}>Informed by indexed prior failures</p>
            <div style={{ background: 'rgba(52,211,153,0.05)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', lineHeight: '1.55', color: '#e2e8f0', border: '1px solid rgba(52,211,153,0.2)', whiteSpace: 'pre-wrap', maxHeight: '220px', overflowY: 'auto' }}>
              {testing ? 'Generating memory-augmented response...' : withMemResponse}
            </div>
          </div>
        </div>
      )}

      <QuickDetailModal item={selectedModalItem} onClose={() => setSelectedModalItem(null)} />
    </div>
  );
}
