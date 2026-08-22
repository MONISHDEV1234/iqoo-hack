import React from 'react';

/**
 * CodeContext Component
 * Renders the file editor view with highlighted lines and crash details.
 * Connects with `isFixApplied` to demonstrate resolution dynamically.
 */
function CodeContext({ isFixApplied }) {
    return (
        <div className="section-card code-context-card">
            <div className="card-header">
                <div className="header-left">
                    <span className="card-title">CODE CONTEXT</span>
                </div>
                <div className="header-right">
                    <span className="file-name-badge">oauth2.service.ts</span>
                </div>
            </div>

            <div className="code-editor-body">
                {/* Line 140 */}
                <div className="code-line">
                    <span className="line-number">140</span>
                    <span className="line-content">
                        <span className="keyword">const</span> response = <span className="keyword">await</span> <span className="keyword">this</span>.httpService.post(tokenUrl, payload);
                    </span>
                </div>

                {/* Line 141 */}
                <div className="code-line">
                    <span className="line-number">141</span>
                    <span className="line-content"></span>
                </div>

                {/* Line 142 (Crash / Highlight Line) */}
                {!isFixApplied ? (
                    <div className="code-line highlight-crash">
                        <span className="line-number">142</span>
                        <span className="line-content">
                            <span className="keyword">const</span> token = response.data.accessToken; <span className="comment">// Crash: response.data is undefined</span>
                        </span>
                    </div>
                ) : (
                    <div className="code-line highlight-fix">
                        <span className="line-number">142</span>
                        <span className="line-content">
                            <span className="keyword">const</span> token = response.data?.accessToken; <span className="comment">// Fix: Optional chaining safeguards access</span>
                        </span>
                    </div>
                )}

                {/* Line 143 */}
                <div className="code-line">
                    <span className="line-number">143</span>
                    <span className="line-content"></span>
                </div>

                {/* Line 144 */}
                <div className="code-line">
                    <span className="line-number">144</span>
                    <span className="line-content">
                        <span className="keyword">return</span> <span className="keyword">this</span>.cacheService.storeToken(userId, token);
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CodeContext;
