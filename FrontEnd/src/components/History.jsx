import React, { useState } from 'react';

/**
 * History Component
 * High-fidelity representation of the Session History view screen.
 * Features:
 * - Search bar with filter parameters and Command-K shortcut indicator.
 * - Sub-tabs: All Sessions, Resolved, and Critical Logs.
 * - Session cards list with state, category badges (red SIGSEGV, gray technology tags), and duration metrics.
 * - Analytics Overview right panel featuring: Accumulated hours saved, Most Frequent Issue badges (OOM_KILL, RACE_COND), and a Resolution Rate SVG glowing area progress chart.
 */
function History() {
    const [activeSubTab, setActiveSubTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Sample Session Records
    const sessions = [
        {
            id: 'SESSION-8924A',
            type: 'bug', // triggers bug bug-icon
            message: 'Memory leak detected in main event loop causing gradual spike.',
            time: '2 mins ago',
            duration: '14m duration',
            tags: [
                { label: 'Node.js', type: 'tech' },
                { label: 'SIGSEGV', type: 'error' }
            ]
        },
        {
            id: 'SESSION-8923B',
            type: 'resolved', // triggers green double check status
            message: 'Resolved dangling pointer issue in parsing microservice.',
            time: '1 hr ago',
            duration: '45m duration',
            tags: [
                { label: 'Rust', type: 'tech' },
                { label: 'Production', type: 'tech' }
            ]
        },
        {
            id: 'SESSION-8922C',
            type: 'abort', // abort/stopped status
            message: 'Session aborted by user mid-trace.',
            italicized: true,
            time: '3 hrs ago',
            tags: [
                { label: 'Python', type: 'tech' }
            ]
        }
    ];

    // Filter items based on active sub-tab and search query
    const filteredSessions = sessions.filter(session => {
        // 1. Tab filtering
        if (activeSubTab === 'resolved' && session.type !== 'resolved') return false;
        if (activeSubTab === 'critical' && session.type !== 'bug') return false; // bug is critical

        // 2. Search query filtering
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                session.id.toLowerCase().includes(q) ||
                session.message.toLowerCase().includes(q) ||
                session.tags.some(tag => tag.label.toLowerCase().includes(q))
            );
        }
        return true;
    });

    return (
        <div className="history-pane-container">
            {/* Dynamic Workspace Split Layout */}
            <div className="history-workspace-grid">

                {/* Left Column: Session Records History feed */}
                <div className="history-feed-column">
                    <div className="history-header-group">
                        <h1 className="history-pane-title">Session History</h1>
                        <button className="btn-filter-settings" aria-label="Toggle filters list">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14" />
                                <line x1="4" y1="10" x2="4" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12" y2="3" />
                                <line x1="20" y1="21" x2="20" y2="16" />
                                <line x1="20" y1="12" x2="20" y2="3" />
                                <line x1="1" y1="14" x2="7" y2="14" />
                                <line x1="9" y1="8" x2="15" y2="8" />
                                <line x1="17" y1="16" x2="23" y2="16" />
                            </svg>
                            <span>Filter</span>
                        </button>
                    </div>

                    {/* Search bar inside content panel */}
                    <div className="history-search-container">
                        <span className="search-icon-wrapper">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="history-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search logs, queries, or error codes (e.g. ERR_MEM_02)"
                        />
                        <div className="shortcut-badge">
                            <span className="key-cap">⌘</span>
                            <span className="key-cap">K</span>
                        </div>
                    </div>

                    {/* Sub-Tab Filter list */}
                    <div className="history-sub-tabs">
                        <button
                            className={`sub-tab-btn ${activeSubTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('all')}
                        >
                            All Sessions
                        </button>
                        <button
                            className={`sub-tab-btn ${activeSubTab === 'resolved' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('resolved')}
                        >
                            Resolved
                        </button>
                        <button
                            className={`sub-tab-btn ${activeSubTab === 'critical' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('critical')}
                        >
                            Critical Logs
                        </button>
                    </div>

                    {/* Cards Stack Feed */}
                    <div className="history-cards-stack">
                        {filteredSessions.length === 0 ? (
                            <div className="placeholder-box">
                                No session logs match your query.
                            </div>
                        ) : (
                            filteredSessions.map((session) => (
                                <div key={session.id} className="session-card-container">
                                    {/* Card Header */}
                                    <div className="session-card-header">
                                        <div className="session-card-id-group">
                                            {session.type === 'bug' && (
                                                <span className="session-icon icon-bug" title="Bug Detected">
                                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                                        <path d="M6 7V5" />
                                                        <path d="M18 7V5" />
                                                    </svg>
                                                </span>
                                            )}
                                            {session.type === 'resolved' && (
                                                <span className="session-icon icon-resolved" title="Resolved Issue">
                                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </span>
                                            )}
                                            {session.type === 'abort' && (
                                                <span className="session-icon icon-abort" title="Session Aborted">
                                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M12 8v4" />
                                                        <path d="M12 16h.01" />
                                                    </svg>
                                                </span>
                                            )}
                                            <span className="session-id-title">{session.id}</span>
                                        </div>
                                        <span className="session-card-time">{session.time}</span>
                                    </div>

                                    {/* Card Body Exception Message */}
                                    <p className={`session-card-msg ${session.italicized ? 'text-italic text-muted' : ''}`}>
                                        {session.message}
                                    </p>

                                    {/* Card Footer tags and metrics */}
                                    <div className="session-card-footer">
                                        <div className="session-card-tags-row">
                                            {session.tags.map((tag, idx) => (
                                                <span key={idx} className={`badge-session-tag ${tag.type}`}>
                                                    {tag.label}
                                                </span>
                                            ))}
                                        </div>
                                        {session.duration && (
                                            <div className="session-duration-group">
                                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <span>{session.duration}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Analytics overview cards */}
                <div className="history-analytics-column">
                    <div className="analytics-header">
                        <svg className="analytics-logo-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        <h2 className="analytics-title">Analytics Overview</h2>
                    </div>
                    <span className="analytics-subtitle text-muted">Last 30 Days</span>

                    {/* Time Saved Metric Card */}
                    <div className="card-total-time-saved">
                        <span className="metric-header-label">TOTAL TIME SAVED</span>
                        <div className="metric-score-row">
                            <span className="metric-value">142</span>
                            <span className="metric-unit">Hours</span>
                        </div>
                        <div className="metric-status-row">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="var(--accent-green)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                            <span>+12% vs last month</span>
                        </div>
                        {/* Visual glow background item */}
                        <div className="light-glow-background" />
                    </div>

                    {/* Frequent Issues Section */}
                    <div className="frequent-issues-section">
                        <h3 className="sub-label-heading">Most Frequent Issues</h3>

                        <div className="frequent-issues-list">
                            {/* OOM KILL card */}
                            <div className="frequent-issue-item">
                                <div className="issue-details-left">
                                    <div className="icon-badge-box red">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="4" y="4" width="16" height="16" rx="2" />
                                            <line x1="9" y1="9" x2="9" y2="15" />
                                            <line x1="15" y1="9" x2="15" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                    </div>
                                    <div className="issue-label-text">
                                        <span className="issue-name">OOM_KILL</span>
                                        <span className="issue-sub-desc">Container limits</span>
                                    </div>
                                </div>
                                <span className="issue-score-count">42 times</span>
                            </div>

                            {/* RACE CONDITIONS card */}
                            <div className="frequent-issue-item">
                                <div className="issue-details-left">
                                    <div className="icon-badge-box yellow">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                    </div>
                                    <div className="issue-label-text">
                                        <span className="issue-name">RACE_COND</span>
                                        <span className="issue-sub-desc">Async handlers</span>
                                    </div>
                                </div>
                                <span className="issue-score-count">18 times</span>
                            </div>
                        </div>
                    </div>

                    {/* SVG Glow Progress Rate Graph Container */}
                    <div className="card-resolution-graph">
                        {/* Real SVG Area chart representing resolution rate details */}
                        <div className="svg-chart-container">
                            <svg className="resolution-svg-chart" viewBox="0 0 320 120" width="100%" height="80">
                                <defs>
                                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgba(124, 58, 237, 0.4)" />
                                        <stop offset="100%" stopColor="rgba(124, 58, 237, 0.0)" />
                                    </linearGradient>
                                </defs>
                                {/* Grid lines */}
                                <line x1="0" y1="30" x2="320" y2="30" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3,3" />
                                <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3,3" />
                                <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3,3" />

                                {/* Area path */}
                                <path d="M 0 110 Q 50 80, 100 85 T 200 40 T 320 30 L 320 120 L 0 120 Z" fill="url(#chartGlow)" />
                                {/* Stroke path */}
                                <path d="M 0 110 Q 50 80, 100 85 T 200 40 T 320 30" fill="none" stroke="var(--accent-purple-border)" strokeWidth="2.5" />
                                {/* Glowing points */}
                                <circle cx="320" cy="30" r="4" fill="var(--accent-purple)" />
                                <circle cx="320" cy="30" r="8" fill="none" stroke="var(--accent-purple)" strokeWidth="1.5" opacity="0.5" />
                            </svg>
                        </div>

                        <div className="resolution-chart-footer">
                            <span className="chart-footer-label">RESOLUTION RATE</span>
                            <span className="chart-footer-value">89.4%</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default History;
