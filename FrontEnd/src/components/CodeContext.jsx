import React from 'react';

/**
 * CodeContext Component
 * Renders the file editor view with dynamic context code blocks.
 */
function CodeContext({ value = '', onChange = () => { }, fileName = 'oauth2.service.ts', isFixApplied }) {
    return (
        <div className="section-card code-context-card">
            <div className="card-header">
                <div className="header-left">
                    <span className="card-title">CODE CONTEXT DESK</span>
                </div>
                <div className="header-right">
                    <span className="file-name-badge">{fileName}</span>
                </div>
            </div>

            <div className="code-editor-body" style={{ padding: '12px 16px' }}>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="// Add local code context files here..."
                    style={{
                        width: '100%',
                        height: '140px',
                        background: 'transparent',
                        border: 'none',
                        resize: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        lineHeight: '1.7'
                    }}
                />

                {isFixApplied && (
                    <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent-green-light)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-green)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', display: 'inline-block' }} />
                        <span>Working fix applied successfully. Dynamic validation handles incoming requests correctly.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CodeContext;
