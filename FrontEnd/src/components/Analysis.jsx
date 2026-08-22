import React, { useState } from 'react';

/**
 * Analysis Component
 * Renders MemCode AI-generated analysis of the crash and the suggested solution block.
 */
function Analysis() {
    const [copied, setCopied] = useState(false);

    const fixCodeText = `// Suggested Fix
if (!response || !response.data) {
  throw new Error('Invalid response from OAuth provider');
}
const token = response.data?.accessToken;`;

    const handleCopyFix = () => {
        navigator.clipboard.writeText(fixCodeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="section-card analysis-card">
            <div className="card-header">
                <span className="card-title">MEMCODE ANALYSIS</span>
            </div>

            <div className="analysis-body">
                <p className="analysis-text">
                    The error <code className="inline-code">TypeError: Cannot read properties of undefined</code> occurs because <code className="inline-code">response.data</code> is missing.
                </p>

                <p className="analysis-text text-secondary-info">
                    This typically happens when the external OAuth provider returns an error response (e.g., 400 Bad Request due to an expired code), but Axios doesn't throw or the interceptor swallows the error body.
                </p>

                {/* Suggested Fix Code Container */}
                <div className="suggested-fix-container">
                    <button
                        className="btn-copy-fix"
                        onClick={handleCopyFix}
                        title="Copy Suggested Fix"
                    >
                        {copied ? (
                            <span className="copy-label success">Copied Fix!</span>
                        ) : (
                            <span className="copy-label">Copy Fix</span>
                        )}
                    </button>

                    <pre className="fix-code-block">
                        <span className="comment">// Suggested Fix</span>{"\n"}
                        <span className="keyword">if</span> (!response || !response.data) {"{\n"}
                        {"  "}<span className="keyword">throw new</span> <span className="class-name">Error</span>(<span className="string">'Invalid response from OAuth provider'</span>);{"\n"}
                        {"}\n"}
                        <span className="keyword">const</span> token = response.data?.accessToken;
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default Analysis;
