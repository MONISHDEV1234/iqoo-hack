import React, { useState } from 'react';

/**
 * StackTrace Component
 * Renders the error stack trace box with preset buttons and interactive input area.
 */
function StackTrace({ value = '', onChange = () => { } }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const presets = [
        {
            label: 'CORS Preflight Error',
            text: `Access to fetch at 'http://localhost:8000/api/users' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control status check. OPTIONS failed.`
        },
        {
            label: 'React Hydration Mismatch',
            text: `Error: Hydration failed because the initial UI does not match what was rendered on the server.\nWarning: Expected server HTML to contain a matching <div> in <body>.`
        },
        {
            label: 'Prisma DB Pool Limit',
            text: `PrismaClientInitializationError: Connection pool limit reached (max_connections = 100). Could not acquire database client connection.`
        }
    ];

    return (
        <div className="section-card stack-trace-card">
            <div className="card-header">
                <span className="card-title">STACK TRACE & LOG INPUT</span>
                <button
                    className="btn-copy"
                    onClick={handleCopy}
                    title="Copy Stack Trace"
                    aria-label="Copy stack trace path"
                >
                    {copied ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--accent-green)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="stack-trace-body">
                <textarea
                    className="stack-trace-code"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste console outputs or debug logs here..."
                    style={{
                        width: '100%',
                        height: '110px',
                        background: 'transparent',
                        border: 'none',
                        resize: 'none',
                        outline: 'none',
                        color: 'inherit',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit'
                    }}
                />

                {/* Micro presets footer */}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Presets:
                    </span>
                    {presets.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => onChange(p.text)}
                            style={{
                                border: '1px solid var(--border-color)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-app)',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-purple)'; e.target.style.color = 'var(--text-active)'; }}
                            onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StackTrace;
