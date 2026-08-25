import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Search, Plus, X, ArrowRight } from 'lucide-react';
import { QuickDetailModal } from '../components/QuickDetailModal';

const CATEGORIES = ['api', 'database', 'frontend', 'backend', 'testing', 'networking', 'authentication', 'state_management', 'environment_config', 'other'];

export function VaultView() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newExp, setNewExp] = useState({
    title: '', problem_summary: '', symptoms: '', error_codes: '',
    category: 'backend', failed_approaches: '', successful_approach: '',
    root_cause: '', lesson: '', scope: 'project',
  });

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const data = await api.listExperiences({
        scope: selectedScope || undefined,
        category: selectedCategory || undefined,
        q: searchQuery || undefined,
      });
      setExperiences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchExperiences, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedScope, selectedCategory]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createExperience({
        title: newExp.title,
        problem_summary: newExp.problem_summary,
        symptoms: newExp.symptoms ? newExp.symptoms.split(',').map(s => s.trim()) : [],
        error_codes: newExp.error_codes ? newExp.error_codes.split(',').map(s => s.trim()) : [],
        category: newExp.category,
        failed_approaches: newExp.failed_approaches ? [newExp.failed_approaches] : [],
        successful_approach: newExp.successful_approach,
        root_cause: newExp.root_cause,
        lesson: newExp.lesson,
        recommended_next_action: newExp.lesson,
        scope: newExp.scope,
        confidence: 0.9,
      });
      setShowCreateModal(false);
      fetchExperiences();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="view-title">Experience <span className="gradient-text">Vault</span></h2>
          <p className="view-subtitle">Search & manage indexed memories</p>
        </div>
        <button id="vault-new-btn" onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '0.8rem' }}>
          <Plus size={15} /> New
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            id="vault-search-input"
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px' }}
            placeholder="Search problems, errors, symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select id="vault-scope-filter" className="input-field" style={{ fontSize: '0.82rem' }} value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)}>
            <option value="">All Scopes</option>
            <option value="project">Project</option>
            <option value="ai">AI</option>
            <option value="universal">Universal</option>
          </select>
          <select id="vault-category-filter" className="input-field" style={{ fontSize: '0.82rem' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '0.85rem' }}>Searching vault...</p>
      ) : experiences.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No experiences matched your query.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {experiences.map((exp) => (
            <div
              key={exp.id}
              id={`vault-exp-${exp.id}`}
              className="glass-panel glass-panel-interactive"
              style={{ padding: '14px', cursor: 'pointer' }}
              onClick={() => setActiveDetail(exp)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1, marginRight: '6px' }}>
                  <span className="badge badge-purple">{exp.category || 'other'}</span>
                  <span className="badge badge-cyan">{exp.scope}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '5px', lineHeight: '1.3' }}>
                #{exp.id} — {exp.title || exp.problem_summary.slice(0, 48)}
              </h3>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {exp.problem_summary}
              </p>

              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {Array.isArray(exp.error_codes) && exp.error_codes.slice(0, 2).map((code, idx) => (
                  <span key={idx} className="badge badge-rose">{code}</span>
                ))}
                {Array.isArray(exp.symptoms) && exp.symptoms.slice(0, 2).map((sym, idx) => (
                  <span key={idx} className="badge badge-emerald">{sym}</span>
                ))}
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                <span>Confidence: <strong>{Math.round((exp.confidence || 0) * 100)}%</strong></span>
                <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                  View <ArrowRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuickDetailModal item={activeDetail} onClose={() => setActiveDetail(null)} />

      {/* Create Modal — compact centered popup */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', animation: 'fadeIn 0.18s ease-out' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '360px', maxHeight: '82vh', overflowY: 'auto', background: 'var(--bg-card)', backdropFilter: 'blur(24px)', borderRadius: '18px', border: '1px solid var(--border-glow)', boxShadow: '0 24px 60px rgba(0,0,0,0.55)', padding: '18px', animation: 'popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Index New Memory</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            <form id="vault-create-form" onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" className="input-field" placeholder="Experience Title *" value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} required />
              <textarea className="input-field" rows={3} placeholder="Problem Summary *" value={newExp.problem_summary} onChange={e => setNewExp({ ...newExp, problem_summary: e.target.value })} required />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" className="input-field" placeholder="Error Codes (csv)" value={newExp.error_codes} onChange={e => setNewExp({ ...newExp, error_codes: e.target.value })} />
                <select className="input-field" value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <input type="text" className="input-field" placeholder="Symptoms (comma-separated)" value={newExp.symptoms} onChange={e => setNewExp({ ...newExp, symptoms: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Failed Approaches / Traps" value={newExp.failed_approaches} onChange={e => setNewExp({ ...newExp, failed_approaches: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Successful Fix *" value={newExp.successful_approach} onChange={e => setNewExp({ ...newExp, successful_approach: e.target.value })} required />
              <textarea className="input-field" rows={2} placeholder="Root Cause" value={newExp.root_cause} onChange={e => setNewExp({ ...newExp, root_cause: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Reusable Lesson *" value={newExp.lesson} onChange={e => setNewExp({ ...newExp, lesson: e.target.value })} required />

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px', paddingBottom: '24px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" id="vault-save-btn" className="btn btn-primary" style={{ flex: 2 }}>Save Memory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
