import React, { useState } from 'react';

/**
 * PastSolutions Component
 * Renders the right sidebar matching history of relevant past bugfixes.
 */
function PastSolutions() {
    const [activeCard, setActiveCard] = useState(0);

    const solutions = [
        {
            id: 0,
            match: '98%',
            matchClass: 'green',
            title: 'Fix Axios interceptor silent failure',
            meta: 'Resolved 2 weeks ago • PR #1042',
            diffType: 'axios',
            code: (
                <pre className="diff-renderer">
                    <span className="diff-line normal">try {"{"} <span className="keyword">const</span> res = <span className="keyword">await</span> axios.post(url); <span className="keyword">return</span> res.data; {"}"} <span className="keyword">catch</span> (err) {"{"}</span>
                    <span className="diff-line diff-add">+   logger.error(err.response?.data);</span>
                    <span className="diff-line normal">{"}"}</span>
                </pre>
            ),
            hasViewAction: true
        },
        {
            id: 1,
            match: '85%',
            matchClass: 'yellow',
            title: 'Add optional chaining to Github...',
            meta: 'Resolved 3 months ago • pr/github-login',
            diffType: 'github',
            code: (
                <pre className="diff-renderer">
                    <span className="diff-line diff-remove">- const token = r.data.token;</span>
                    <span className="diff-line diff-add">+ const token = r.data?.token;</span>
                    <span className="diff-line diff-add">+ if (!token) throw new Error('No token');</span>
                </pre>
            ),
            hasViewAction: false
        },
        {
            id: 2,
            match: '42%',
            matchClass: 'gray',
            title: 'Handle undefined user session data',
            meta: 'Resolved 6 months ago • core/session',
            hasViewAction: false
        }
    ];

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
                <span className="meta-matches-badge">3 Matches</span>
            </div>

            {/* Solutions Cards List */}
            <div className="solutions-list">
                {solutions.map((sol) => {
                    const isActive = activeCard === sol.id;
                    return (
                        <div
                            key={sol.id}
                            className={`solution-card ${sol.matchClass} ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveCard(sol.id)}
                        >
                            {/* Top Row: Meta details & Match Badge */}
                            <div className="card-top-row">
                                <span className="sol-meta-info">{sol.meta}</span>
                                <span className={`match-badge ${sol.matchClass}`}>{sol.match}</span>
                            </div>

                            {/* Title */}
                            <h3 className="sol-title">{sol.title}</h3>

                            {/* Inside Code Diff View (if available) */}
                            {sol.code && (
                                <div className="sol-diff-box">
                                    {sol.code}
                                </div>
                            )}

                            {/* View Solution action link / button */}
                            {sol.hasViewAction && (
                                <button
                                    className="btn-view-sol"
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent card click reactivation
                                        alert(`Opening solution details for: ${sol.title}`);
                                    }}
                                >
                                    View Solution
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PastSolutions;
