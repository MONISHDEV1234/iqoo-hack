import React, { useState } from 'react';
import { api } from '../api/client';
import { Search, Sliders, FileText, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { QuickDetailModal } from '../components/QuickDetailModal';

export function RetrievalView() {
  const [problemText, setProblemText] = useState('Signature verification failed in PyJWT when decoding auth header token in FastAPI');
  const [retrievalResults, setRetrievalResults] = useState(null);
  const [report, setReport] = useState('');
  
  const [testing, setTesting] = useState(false);
  const [withoutMemResponse, setWithoutMemResponse] = useState('');
  const [withMemResponse, setWithMemResponse] = useState('');
  const [selectedModalItem, setSelectedModalItem] = useState(null);

  const handleTest = async () => {
    setTesting(true);
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

      const resWithout = await api.askLLM({
        problem_text: problemText,
        mode: 'without_memory',
      });
      setWithoutMemResponse(resWithout.response);

      const resWith = await api.askLLM({
        problem_text: problemText,
        report_text: rep.report,
        mode: 'with_memory',
      });
      setWithMemResponse(resWith.response);
    } catch (err) {
      alert(`Retrieval test error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
          Retrieval Inspector & <span className="gradient-text">AI Comparison</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Test hybrid vector/FTS scoring and compare LLM responses side-by-side (Without Memory vs With Memory).
        </p>
      </div>

      {/* Query Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Current Problem Query Simulator:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: 1 }}
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Type error symptom or code issue..."
          />
          <button onClick={handleTest} disabled={testing || !problemText.trim()} className="btn btn-primary">
            <Search size={16} /> Execute Retrieval & AI Test
          </button>
        </div>
      </div>

      {/* Grid */}
      {retrievalResults && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          
          {/* Scoring Inspector */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} />
              Scoring Inspector (Click item for floating bar)
            </h3>

            {retrievalResults.results?.length === 0 ? (
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No relevant experience matched threshold (&ge; 0.55).</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {retrievalResults.results.map((r) => (
                  <div
                    key={r.id}
                    className="glass-panel-interactive"
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                    onClick={() => setSelectedModalItem(r)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>
                        Experience #{r.id}: {r.title || r.problem_summary.slice(0, 35)}
                      </span>
                      <span className="badge badge-emerald">{r.score_pct || Math.round((r.score || 0) * 100)}% Match</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      <div>Semantic Cosine: <strong>{Math.round((r.feature_breakdown?.semantic || 0) * 100)}%</strong></div>
                      <div>Error Code Match: <strong>{r.feature_breakdown?.error_match ? '100%' : '0%'}</strong></div>
                      <div>Framework Match: <strong>{Math.round((r.feature_breakdown?.framework_match || 0) * 100)}%</strong></div>
                      <div>Language Match: <strong>{r.feature_breakdown?.language_match ? '100%' : '0%'}</strong></div>
                    </div>

                    <div style={{ paddingTop: '8px', marginTop: '8px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      <span>Floating Summary <ArrowRight size={13} /></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MISTAKEMEMO_REPORT Block */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileText size={16} style={{ color: 'var(--accent-purple)' }} />
              Generated MISTAKEMEMO_REPORT Block
            </h3>

            <div className="code-block" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {report || 'Report will be rendered here after execution.'}
            </div>
          </div>

        </div>
      )}

      {/* Side-by-Side Comparison */}
      {(withoutMemResponse || withMemResponse || testing) && (
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '14px' }}>
            AI Response <span className="gradient-text">Before vs After Memory</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid var(--accent-rose)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <XCircle size={18} style={{ color: 'var(--accent-rose)' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-rose)' }}>Without Memory (Standard Prompt)</h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '12px' }}>
                Generic LLM attempt without prior workspace debug context.
              </p>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.5', color: '#cbd5e1', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                {testing ? 'Generating response without memory...' : withoutMemResponse}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-emerald)' }}>With MistakeMemo (Memory Informed)</h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '12px' }}>
                Informed by indexed prior failures and verified solutions.
              </p>
              <div style={{ background: 'rgba(52, 211, 153, 0.05)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.5', color: '#e2e8f0', border: '1px solid rgba(52, 211, 153, 0.2)', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                {testing ? 'Generating memory-augmented response...' : withMemResponse}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Detail Bar */}
      <QuickDetailModal
        item={selectedModalItem}
        onClose={() => setSelectedModalItem(null)}
      />
    </div>
  );
}
