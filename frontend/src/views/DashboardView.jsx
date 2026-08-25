import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Database, Search, Zap, Layers, RefreshCw, Award, ArrowRight } from 'lucide-react';
import { QuickDetailModal } from '../components/QuickDetailModal';

export function DashboardView() {
  const [stats, setStats] = useState(null);
  const [recentExps, setRecentExps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModalItem, setSelectedModalItem] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      const exps = await api.listExperiences({ limit: 5 });
      setRecentExps(exps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} style={{ marginBottom: '16px' }} />
        <p>Loading MistakeMemo Core Metrics...</p>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Experiences', value: stats?.total_experiences || 0, icon: Database, color: 'var(--accent-cyan)' },
    { title: 'Memory Recalls', value: stats?.total_recalls || 0, icon: Search, color: 'var(--accent-purple)' },
    { title: 'Recalls in Reports', value: stats?.recalls_used_in_report || 0, icon: Award, color: 'var(--accent-emerald)' },
    { title: 'Captured Sessions', value: stats?.total_sessions || 0, icon: Zap, color: 'var(--accent-amber)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
            System <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time telemetry and memory vault metrics from local core.
          </p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {card.title}
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                  {card.value}
                </span>
              </div>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color
              }}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Recent Experiences */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent-cyan)' }} />
              Recent Indexings (Click box for short floating summary)
            </h3>
            <span className="badge badge-cyan">Latest 5</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentExps.length === 0 ? (
              <p style={{ color: 'var(--text-subtle)', fontStyle: 'italic', padding: '16px 0' }}>
                No experiences indexed yet. Run a session extraction or seed memories.
              </p>
            ) : (
              recentExps.map((exp) => (
                <div
                  key={exp.id}
                  className="glass-panel-interactive"
                  style={{
                    padding: '14px', borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedModalItem(exp)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      #{exp.id} — {exp.title || exp.problem_summary.slice(0, 50)}
                    </span>
                    <span className="badge badge-purple">{exp.category}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {exp.problem_summary}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    <span>Scope: <strong>{exp.scope}</strong> | Confidence: <strong>{Math.round((exp.confidence || 0) * 100)}%</strong></span>
                    <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      Quick Floating Bar <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(stats?.experiences_by_category || {}).map(([cat, count]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{cat}</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{count}</span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (count / (stats?.total_experiences || 1)) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Scopes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats?.experiences_by_scope || {}).map(([scope, count]) => (
                <div key={scope} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{scope}</span>
                  <span className="badge badge-emerald">{count} items</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Detail Bar */}
      <QuickDetailModal
        item={selectedModalItem}
        onClose={() => setSelectedModalItem(null)}
      />
    </div>
  );
}
