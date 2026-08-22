import React, { useState, useEffect } from 'react';

/**
 * Parses inline formatting tags (**bold** and `code`) from text into structured React nodes.
 */
function parseInlineFormatting(text) {
    if (!text) return '';

    let parts = [{ text, type: 'text' }];

    // 1. Process bold (**text**)
    let boldProcessed = [];
    parts.forEach(part => {
        if (part.type === 'text') {
            const splits = part.text.split('**');
            splits.forEach((chunk, i) => {
                boldProcessed.push({
                    text: chunk,
                    type: i % 2 === 1 ? 'bold' : 'text'
                });
            });
        } else {
            boldProcessed.push(part);
        }
    });

    // 2. Process inline code (`code`)
    let codeProcessed = [];
    boldProcessed.forEach(part => {
        if (part.type === 'text') {
            const splits = part.text.split('`');
            splits.forEach((chunk, i) => {
                codeProcessed.push({
                    text: chunk,
                    type: i % 2 === 1 ? 'code' : 'text'
                });
            });
        } else if (part.type === 'bold') {
            const splits = part.text.split('`');
            splits.forEach((chunk, i) => {
                codeProcessed.push({
                    text: chunk,
                    type: i % 2 === 1 ? 'bold-code' : 'bold'
                });
            });
        } else {
            codeProcessed.push(part);
        }
    });

    return codeProcessed.map((part, idx) => {
        if (part.type === 'bold') {
            return <strong key={idx} style={{ color: 'var(--text-active)', fontWeight: '700' }}>{part.text}</strong>;
        }
        if (part.type === 'code') {
            return (
                <code key={idx} className="inline-code" style={{
                    padding: '2px 6px',
                    margin: '0 2px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#fc8181'
                }}>
                    {part.text}
                </code>
            );
        }
        if (part.type === 'bold-code') {
            return (
                <code key={idx} className="inline-code" style={{
                    padding: '2px 6px',
                    margin: '0 2px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#fc8181',
                    fontWeight: 'bold'
                }}>
                    {part.text}
                </code>
            );
        }
        return part.text;
    });
}

/**
 * Formats multi-line text with headings, horizontal lines, list items, and paragraph tags.
 */
function renderFormattedContent(text) {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) {
            return <div key={idx} style={{ height: '8px' }} />;
        }

        // Handle horizontal line separators
        if (trimmed === '---') {
            return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '14px 0' }} />;
        }

        // Handle Headings (e.g. ### 1. Title)
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = parseInlineFormatting(headingMatch[2]);
            const fontSize = level === 1 ? '15px' : level === 2 ? '13.5px' : '12.5px';
            return (
                <h4 key={idx} style={{
                    fontSize,
                    fontWeight: '750',
                    color: 'var(--text-active)',
                    marginTop: '16px',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-sans)',
                    display: 'block',
                    letterSpacing: '0.3px'
                }}>
                    {content}
                </h4>
            );
        }

        // Handle List Bullet points
        const listMatch = trimmed.match(/^([\*\-\+])\s+(.*)$/);
        if (listMatch) {
            const content = parseInlineFormatting(listMatch[2]);
            return (
                <div key={idx} style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    paddingLeft: '8px',
                    marginBottom: '6px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)'
                }}>
                    <span style={{ color: 'var(--accent-purple)', fontSize: '13px', lineHeight: '1.2' }}>•</span>
                    <span>{content}</span>
                </div>
            );
        }

        // Handle Numbered List items (e.g. "1. Does not handle...")
        const numListMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
        if (numListMatch) {
            const num = numListMatch[1];
            const content = parseInlineFormatting(numListMatch[2]);
            return (
                <div key={idx} style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    paddingLeft: '8px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)'
                }}>
                    <span style={{ color: 'var(--accent-purple-border)', fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{num}</span>
                    <span>{content}</span>
                </div>
            );
        }

        // Standard Paragraph
        return (
            <p key={idx} style={{
                fontSize: '12px',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                marginBottom: '10px',
                marginTop: 0
            }}>
                {parseInlineFormatting(trimmed)}
            </p>
        );
    });
}

/**
 * Analysis Component
 * Displays the AI diagnostic outcome, code suggestions, and the SQLite indexing form.
 */
function Analysis({
    isAnalyzing = false,
    analysisResult = null,
    onStartAnalysis = () => { },
    onSaveToMemory = () => { }
}) {
    const [copied, setCopied] = useState(false);

    // Indexing Form Fields
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('other');
    const [lesson, setLesson] = useState('');

    useEffect(() => {
        if (analysisResult) {
            setTitle(analysisResult.title || 'Corrected Exception Handler');
            setCategory(analysisResult.category || 'other');
            setLesson(analysisResult.rootCause.slice(0, 180).replace(/[#*`]/g, '') || 'Root cause and fix verified.');
        }
    }, [analysisResult]);

    const handleCopyFix = () => {
        if (!analysisResult) return;
        navigator.clipboard.writeText(analysisResult.suggestedFix);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleIndexSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !lesson.trim()) return;
        onSaveToMemory({
            title,
            category,
            lesson
        });
        setTitle('');
        setLesson('');
    };

    return (
        <div className="section-card analysis-card">
            {/* Inject keyframe animation rules */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes skeleton-shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
                .skeleton-line {
                    height: 12px;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #1f1f2e 25%, #2a2a3d 50%, #1f1f2e 75%);
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 1.5s infinite ease-in-out;
                }
            `}} />

            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">🤖 AI ANALYSIS & RECOMMENDATIONS</span>
                {!analysisResult && !isAnalyzing && (
                    <button
                        onClick={onStartAnalysis}
                        type="button"
                        style={{
                            padding: '6px 12px',
                            background: '#512da8',
                            border: 'none',
                            color: '#fff',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#5e35b1'}
                        onMouseOut={(e) => e.target.style.background = '#512da8'}
                    >
                        Analyze & Query Memories
                    </button>
                )}
            </div>

            <div className="analysis-body" style={{ padding: '20px 24px' }}>
                {isAnalyzing ? (
                    /* High-fidelity glowing skeleton loader dashboard animation */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                                height: '8px',
                                width: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-purple)',
                                animation: 'pulse 1.2s infinite'
                            }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                Querying vector schemas & computing diagnostic matrices...
                            </span>
                        </div>
                        <div className="skeleton-line" style={{ width: '95%' }} />
                        <div className="skeleton-line" style={{ width: '88%' }} />
                        <div className="skeleton-line" style={{ width: '92%' }} />
                        <div className="skeleton-line" style={{ width: '60%', marginTop: '6px' }} />

                        <div style={{
                            marginTop: '20px',
                            height: '80px',
                            border: '1px dashed var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Synthesizing suggested code fixes...</span>
                        </div>
                    </div>
                ) : !analysisResult ? (
                    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12.5px' }}>
                        Provide trace inputs above and press Analyze to query the memory vault database.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                        {/* Explanation block */}
                        <div>
                            <p style={{ fontWeight: '750', fontSize: '12.5px', marginBottom: '14px', color: 'var(--accent-purple-border)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '3px', height: '12px', background: 'var(--accent-purple)', borderRadius: '2px', display: 'inline-block' }} />
                                Diagnostic Evaluation
                            </p>
                            <div style={{ paddingLeft: '2px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {renderFormattedContent(analysisResult.rootCause)}
                            </div>

                            {analysisResult.technicalExplanation && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '14px 18px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.015)',
                                    borderLeft: '4px solid var(--accent-purple)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {renderFormattedContent(analysisResult.technicalExplanation)}
                                </div>
                            )}
                        </div>

                        {/* Suggested Fix Code Container */}
                        <div className="suggested-fix-container">
                            <button
                                className="btn-copy-fix"
                                onClick={handleCopyFix}
                                title="Copy Suggested Fix"
                                style={{ zIndex: 10 }}
                            >
                                {copied ? (
                                    <span className="copy-label success">Copied Fix!</span>
                                ) : (
                                    <span className="copy-label">Copy Fix</span>
                                )}
                            </button>

                            <pre className="fix-code-block">
                                {analysisResult.suggestedFix}
                            </pre>
                        </div>

                        {/* Save to Long-Term Memory form */}
                        <form onSubmit={handleIndexSubmit} style={{
                            padding: '18px',
                            backgroundColor: 'rgba(124, 58, 237, 0.03)',
                            border: '1px solid rgba(124, 58, 237, 0.15)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            marginTop: '8px'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-purple-border)', display: 'block' }}>
                                💾 Index into Long-Term Memory Database
                            </span>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Memory Title</label>
                                    <input
                                        type="text"
                                        required
                                        style={{
                                            background: 'var(--bg-code)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '6px 10px',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            fontSize: '12px'
                                        }}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Category Tag</label>
                                    <select
                                        style={{
                                            background: 'var(--bg-code)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '6px 10px',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            fontSize: '12px'
                                        }}
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="bug">bug</option>
                                        <option value="config">config</option>
                                        <option value="perf">perf</option>
                                        <option value="other">other</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Notes / Lesson Summary</label>
                                <textarea
                                    required
                                    style={{
                                        background: 'var(--bg-code)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '8px 10px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontSize: '12px',
                                        fontFamily: 'inherit',
                                        height: '50px',
                                        resize: 'none'
                                    }}
                                    value={lesson}
                                    onChange={(e) => setLesson(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '6px 14px',
                                        backgroundColor: '#512da8',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: '600',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Confirm & Index experience
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Analysis;
