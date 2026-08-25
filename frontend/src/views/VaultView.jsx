import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Search, Plus, X, ArrowRight } from 'lucide-react';
import { QuickDetailModal } from '../components/QuickDetailModal';

export function VaultView() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newExp, setNewExp] = useState({
    title: '',
    problem_summary: '',
    symptoms: '',
    error_codes: '',
    category: 'backend',
    failed_approaches: '',
    successful_approach: '',
    root_cause: '',
    lesson: '',
    scope: 'project',
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
    const timer = setTimeout(() => {
      fetchExperiences();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedScope, selectedCategory]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
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
      };
      await api.createExperience(payload);
      setShowCreateModal(false);
      fetchExperiences();
    } catch (err) {
      alert(`Error creating experience: ${err.message}`);
    }
  };

  const categories = ['api', 'database', 'frontend', 'backend', 'testing', 'networking', 'authentication', 'state_management', 'environment_config', 'other'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
            Experience <span className="gradient-text">Vault</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Search, filter, and tap any experience box to inspect in floating bar.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Experience
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '14px', marginBottom: '24px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px' }}
            placeholder="Search problem summary, error codes, symptoms, or lessons (FTS5)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select className="input-field" style={{ width: '150px' }} value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)}>
          <option value="">All Scopes</option>
          <option value="project">Project Scope</option>
          <option value="ai">AI Scope</option>
          <option value="universal">Universal Scope</option>
        </select>

        <select className="input-field" style={{ width: '160px' }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Searching vault...</p>
      ) : experiences.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No experiences matched your query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="glass-panel glass-panel-interactive"
              style={{ padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => setActiveDetail(exp)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="badge badge-purple">{exp.category || 'other'}</span>
                <span className="badge badge-cyan">{exp.scope}</span>
              </div>

              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '6px', lineHeight: '1.3' }}>
                #{exp.id} — {exp.title || exp.problem_summary.slice(0, 50)}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {exp.problem_summary}
              </p>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {Array.isArray(exp.error_codes) && exp.error_codes.map((code, idx) => (
                  <span key={idx} className="badge badge-rose">{code}</span>
                ))}
                {Array.isArray(exp.symptoms) && exp.symptoms.slice(0, 2).map((sym, idx) => (
                  <span key={idx} className="badge badge-emerald">{sym}</span>
                ))}
              </div>

              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                <span>Confidence: <strong>{Math.round((exp.confidence || 0) * 100)}%</strong></span>
                <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  Tap for Floating Summary <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Detail Bar */}
      <QuickDetailModal
        item={activeDetail}
        onClose={() => setActiveDetail(null)}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Index New Memory Experience</h2>
            
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" className="input-field" placeholder="Experience Title" value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} required />
              <textarea className="input-field" rows={2} placeholder="Problem Summary" value={newExp.problem_summary} onChange={e => setNewExp({ ...newExp, problem_summary: e.target.value })} required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" className="input-field" placeholder="Error Codes (comma-separated)" value={newExp.error_codes} onChange={e => setNewExp({ ...newExp, error_codes: e.target.value })} />
                <select className="input-field" value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <textarea className="input-field" rows={2} placeholder="Failed Approach / Traps to avoid" value={newExp.failed_approaches} onChange={e => setNewExp({ ...newExp, failed_approaches: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Successful Fix / Approach" value={newExp.successful_approach} onChange={e => setNewExp({ ...newExp, successful_approach: e.target.value })} required />
              <textarea className="input-field" rows={2} placeholder="Reusable Lesson / Rule" value={newExp.lesson} onChange={e => setNewExp({ ...newExp, lesson: e.target.value })} required />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Memory</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
