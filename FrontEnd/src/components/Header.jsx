import React from 'react';

/**
 * Header Component
 * Displays the error status header bar with dynamic reload and fix controls.
 */
function Header({ onReload, onRunFix, isReloading, isFixApplied }) {
    return (
        <div className="header-container-inner">
            {/* Target status details */}
            <div className="header-status-group">
                <div className="status-badge-icon">
                    {/* Alert triangle icon */}
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <div className="status-text-details">
                    <h1 className="status-title">Unhandled Promise Rejection</h1>
                    <span className="status-path-badge">
                        src/modules/auth/oauth2.service.ts:142
                    </span>
                </div>
            </div>

            {/* Header Actions controls */}
            <div className="header-actions">
                {/* Reload button */}
                <button
                    className={`btn-action btn-secondary ${isReloading ? 'spinning' : ''}`}
                    onClick={onReload}
                    disabled={isReloading}
                >
                    <span className="btn-icon">
                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                    </span>
                    <span>Reload</span>
                </button>

                {/* Run Fix button */}
                <button
                    className={`btn-action btn-primary ${isFixApplied ? 'applied' : ''}`}
                    onClick={onRunFix}
                    disabled={isReloading}
                >
                    {!isFixApplied ? (
                        <>
                            <span className="btn-icon">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            </span>
                            <span>Run Fix</span>
                        </>
                    ) : (
                        <>
                            <span className="btn-icon">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                            <span>Fix Applied</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default Header;
