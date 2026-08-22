import React, { useState } from 'react';

/**
 * PastSolutions Component
 * Renders the right sidebar matching history of relevant past bugfixes.
 */
function PastSolutions({
    solutions = [],
    onSelectSolution = () => { },
    onDeleteSolution = () => { }
}) {
    const [expandedCard, setExpandedCard] = useState(null);

    const handleCopy = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        alert('Fix snippet copied to clipboard.');
    };

    return (
        <div className="past-solutions-vertical">
            {/* Sidebar Header */}
            <div className="solutions-header">
                <span className="solutions-header-title">
                    <svg className="link-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    RELEVANT PAST SOLUTIONS
                </span>
                <span className="meta-matches-badge">
                    {solutions.length} Matches
                </span>
            </div>

            {/* Solutions Cards List */}
            <div className="solutions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {solutions.length === 0 ? (
                    <div style={{
                        padding: '30px 20px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px'
                    }}>
                        No matches found. Run AI analysis to search database.
                    </div>
                ) : (
                    solutions.map((sol) => {
                        const isExpanded = expandedCard === sol.id;
                        const scorePct = Math.round(sol.score * 100) || 85;

                        let badgeClass = 'gray';
                        let cardClass = '';
                        if (scorePct >= 90) {
                            badgeClass = 'green';
                            cardClass = 'green';
                        } else if (scorePct >= 70) {
                            badgeClass = 'yellow';
                            cardClass = 'yellow';
                        }

                        return (
                            <div
                                key={sol.id}
                                className={`solution-card ${cardClass}`}
                                style={{ cursor: 'pointer', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                                onClick={() => setExpandedCard(isExpanded ? null : sol.id)}
                            >
                                {/* Top Row: Meta details & Match Badge */}
                                <div className="card-top-row">
                                    <span className="sol-meta-info">exp #{sol.id} • {sol.category || 'bug'}</span>
                                    <span className={`match-badge ${badgeClass}`}>{scorePct}%</span>
                                </div>

                                {/* Title */}
                                <h3 className="sol-title" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-active)' }}>
                                    {sol.title}
                                </h3>

                                {/* Lessons summary preview */}
                                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                    {sol.lesson || sol.root_cause || 'No root cause summary recorded.'}
                                </p>

                                {/* Inside Code Diff View (if expanded) */}
                                {isExpanded && (sol.solution || sol.successful_approach) && (
                                    <div className="sol-diff-box">
                                        <pre className="diff-renderer" style={{ margin: 0, padding: '10px', background: 'var(--bg-code)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '11px', color: 'var(--text-primary)' }}>
                                            {sol.solution || sol.successful_approach}
                                        </pre>
                                    </div>
                                )}

                                {/* Bottom action buttons */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onDeleteSolution(sol.id); }}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                                        onMouseOver={(e) => e.target.style.color = 'var(--accent-red)'}
                                        onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                                    >
                                        Delete
                                    </button>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className="btn-view-sol"
                                            onClick={(e) => handleCopy(e, sol.solution || sol.successful_approach)}
                                            style={{ padding: '4px 8px', fontSize: '11px', height: '26px' }}
                                        >
                                            Copy Code
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-view-sol"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectSolution(sol);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                height: '26px',
                                                backgroundColor: 'var(--accent-purple)',
                                                color: '#fff',
                                                border: 'none'
                                            }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default PastSolutions;
