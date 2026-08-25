import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Bot, Send, Flame, RefreshCw } from 'lucide-react';

export function CoachView() {
  const [messages, setMessages] = useState([
    {
      sender: 'coach',
      text: "Hello! I'm your MistakeMemo Coach. Ask me about your recurring debugging mistakes or patterns across projects.",
      cited_experiences: [],
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const chatEndRef = useRef(null);

  const fetchPatterns = async () => {
    try {
      const data = await api.getRecurringPatterns();
      setPatterns(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || sending) return;

    const userText = inputMsg;
    setInputMsg('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await api.sendCoachMessage(userText);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: res.response || res.message,
          cited_experiences: res.cited_experiences || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: `Coach API error: ${err.message}`,
          cited_experiences: [],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
          Debugging <span className="gradient-text">Coach & Patterns</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ask your personalized AI debugging coach about recurring mistakes grounded strictly in your memory vault.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Chat Panel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '540px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid var(--border-glass)', marginBottom: '14px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem' }}>MistakeMemo Coach</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>● Grounded in Vault Experiences</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid',
                  borderColor: m.sender === 'user' ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-glass)',
                  borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '12px 16px',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  color: '#fff',
                }}
              >
                <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>

                {Array.isArray(m.cited_experiences) && m.cited_experiences.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>Cites:</span>
                    {m.cited_experiences.map((id) => (
                      <span key={id} className="badge badge-purple" style={{ fontSize: '0.68rem' }}>#{id}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                Coach is analyzing memory vault...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. What mistakes do I repeatedly make with FastAPI or React?"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <button type="submit" disabled={sending || !inputMsg.trim()} className="btn btn-primary">
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Pattern Side Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} style={{ color: 'var(--accent-rose)' }} />
              Recurring Patterns
            </h3>
            <button onClick={fetchPatterns} className="btn btn-secondary" style={{ padding: '4px 6px' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
            Top recurring categories and failure patterns calculated via SQL aggregation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(patterns?.top_categories || []).map((cat, idx) => (
              <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-main)' }}>{cat.category || cat.pattern || 'Category'}</span>
                  <span className="badge badge-rose">{cat.count || cat.frequency} hits</span>
                </div>
              </div>
            ))}

            {(!patterns?.top_categories || patterns.top_categories.length === 0) && (
              <p style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                No recurring patterns registered yet.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
