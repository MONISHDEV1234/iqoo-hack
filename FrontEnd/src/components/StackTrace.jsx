import React, { useState } from 'react';

/**
 * StackTrace Component
 * Renders the error stack trace box with clipboard integration.
 */
function StackTrace() {
    const [copied, setCopied] = useState(false);

    const stackTraceText = `TypeError: Cannot read properties of undefined (reading 'accessToken')
    at OAuth2Service.exchangeCodeForToken (/var/www/app/src/modules/auth/oauth2.service.ts:142:36)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async AuthController.callback (/var/www/app/src/modules/auth/oauth2.service.ts:80:20)`;

    const handleCopy = () => {
        navigator.clipboard.writeText(stackTraceText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="section-card stack-trace-card">
            <div className="card-header">
                <span className="card-title">STACK TRACE INPUT</span>
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
                <pre className="stack-trace-code">
                    {stackTraceText}
                </pre>
            </div>
        </div>
    );
}

export default StackTrace;
