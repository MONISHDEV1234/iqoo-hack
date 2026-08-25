import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Database, Search, Zap, Award, RefreshCw, Layers, ArrowRight } from 'lucide-react';
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

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.85rem' }}>Loading metrics...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statCards = [
    { title: 'Experiences', value: stats?.total_experiences ?? 0,     icon: Database, color: 'var(--accent-cyan)'    },
    { title: 'Recalls',     value: stats?.total_recalls ?? 0,         icon: Search,   color: 'var(--accent-purple)'  },
    { title: 'In Reports',  value: stats?.recalls_used_in_report ?? 0,icon: Award,    color: 'var(--accent-emerald)' },
    { title: 'Sessions',    value: stats?.total_sessions ?? 0,        icon: Zap,      color: 'var(--accent-amber)'   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Page heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="view-title">System <span className="gradient-text">Dashboard</span></h2>
          <p className="view-subtitle">Real-time memory vault metrics</p>
        </div>
        <button id="dashboard-refresh-btn" onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards — 2-per-row grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color,
                  flexShrink: 0,
                }}>
                  <Icon size={17} />
                </div>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{card.title}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Experiences */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} style={{ color: 'var(--accent-cyan)' }} />
            Recent Indexings
          </h3>
          <span className="badge badge-cyan">Latest 5</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentExps.length === 0 ? (
            <p style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.82rem', padding: '12px 0' }}>
              No experiences indexed yet.
            </p>
          ) : (
            recentExps.map((exp) => (
              <div
                key={exp.id}
                className="glass-panel-interactive"
                style={{
                  padding: '12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedModalItem(exp)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', flex: 1, marginRight: '8px' }}>
                    #{exp.id} — {(exp.title || exp.problem_summary).slice(0, 40)}
                  </span>
                  <span className="badge badge-purple" style={{ flexShrink: 0 }}>{exp.category}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {exp.problem_summary}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  <span>Conf: <strong>{Math.round((exp.confidence || 0) * 100)}%</strong></span>
                  <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    Details <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Top Categories</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(stats?.experiences_by_category || {}).map(([cat, count]) => (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{cat}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{count}</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (count / (stats?.total_experiences || 1)) * 100)}%`,
                  background: 'linear-gradient(90deg, #ef4444, #3b82f6)',
                  borderRadius: '3px',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scopes */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>By Scope</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(stats?.experiences_by_scope || {}).map(([scope, count]) => (
            <div key={scope} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{scope}</span>
              <span className="badge badge-emerald">{count} items</span>
            </div>
          ))}
        </div>
      </div>

      <QuickDetailModal item={selectedModalItem} onClose={() => setSelectedModalItem(null)} />
    </div>
  );
}
