import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Bot, Send, Flame, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export function CoachView() {
  const [messages, setMessages] = useState([
    {
      sender: 'coach',
      text: "Hello! I'm your Sentinel Coach. Ask me about your recurring debugging mistakes or patterns across projects.",
      cited_experiences: [],
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const [showPatterns, setShowPatterns] = useState(false);
  const chatEndRef = useRef(null);

  const fetchPatterns = async () => {
    try {
      const data = await api.getRecurringPatterns();
      setPatterns(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPatterns(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || sending) return;

    const userText = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await api.sendCoachMessage(userText);
      setMessages(prev => [
        ...prev,
        {
          sender: 'coach',
          text: res.response || res.message,
          cited_experiences: res.cited_experiences || [],
        },
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'coach', text: `Error: ${err.message}`, cited_experiences: [] }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div>
        <h2 className="view-title">Debugging <span className="gradient-text">Coach</span></h2>
        <p className="view-subtitle">Ask about recurring mistakes grounded in your memory vault</p>
      </div>

      {/* Chat Panel */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column' }}>
        {/* Coach identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)', marginBottom: '12px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #ef4444, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <Bot size={15} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Sentinel Coach</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)' }}>● Grounded in Vault Experiences</div>
          </div>
        </div>

        {/* Messages */}
        <div id="coach-chat-messages" style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                  : 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: m.sender === 'user' ? 'rgba(56,189,248,0.3)' : 'var(--border-glass)',
                borderRadius: m.sender === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                padding: '10px 13px',
                fontSize: '0.84rem',
                lineHeight: '1.5',
                color: '#fff',
              }}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
              {Array.isArray(m.cited_experiences) && m.cited_experiences.length > 0 && (
                <div style={{ marginTop: '6px', paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-purple)' }}>Cites:</span>
                  {m.cited_experiences.map(id => (
                    <span key={id} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>#{id}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-subtle)', fontSize: '0.78rem', fontStyle: 'italic' }}>
              Coach is analyzing vault...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form id="coach-chat-form" onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
          <input
            id="coach-chat-input"
            type="text"
            className="input-field"
            placeholder="e.g. What mistakes do I keep making with FastAPI?"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            id="coach-send-btn"
            disabled={sending || !inputMsg.trim()}
            className="btn btn-primary"
            style={{ padding: '0 14px', flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Recurring Patterns — collapsible */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPatterns ? '0' : '0' }}
        >
          <button
            id="coach-patterns-toggle"
            onClick={() => setShowPatterns(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', flex: 1, textAlign: 'left' }}
          >
            <Flame size={16} style={{ color: 'var(--accent-rose)' }} />
            <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Recurring Patterns</h3>
            {showPatterns ? <ChevronUp size={16} style={{ color: 'var(--text-subtle)', marginLeft: 'auto' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-subtle)', marginLeft: 'auto' }} />}
          </button>
          <button
            onClick={fetchPatterns}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px 6px', marginLeft: '8px' }}
            title="Refresh patterns"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {showPatterns && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>
              Top recurring categories via SQL aggregation.
            </p>
            {(patterns?.top_categories || []).map((cat, idx) => (
              <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-main)', fontSize: '0.84rem' }}>
                  {cat.category || cat.pattern || 'Category'}
                </span>
                <span className="badge badge-rose">{cat.count || cat.frequency} hits</span>
              </div>
            ))}
            {(!patterns?.top_categories || patterns.top_categories.length === 0) && (
              <p style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                No recurring patterns yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
