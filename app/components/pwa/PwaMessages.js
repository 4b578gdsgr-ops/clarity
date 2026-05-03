'use client';
import { useState, useEffect, useRef } from 'react';

const STATUS_COLORS = {
  new: { bg: '#fef3c7', color: '#92400e', label: 'New' },
  confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
  picked_up: { bg: '#e0e7ff', color: '#3730a3', label: 'Picked up' },
  in_progress: { bg: '#ede9fe', color: '#6d28d9', label: 'In progress' },
  ready: { bg: '#d1fae5', color: '#065f46', label: 'Ready' },
  out_for_delivery: { bg: '#cffafe', color: '#0e7490', label: 'Out for delivery' },
  complete: { bg: '#f3f4f6', color: '#374151', label: 'Complete' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  no_show: { bg: '#fee2e2', color: '#991b1b', label: 'No show' },
};

export default function PwaMessages({ profile, onBack }) {
  const [messages, setMessages] = useState(null);
  const [canMessage, setCanMessage] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  async function load() {
    try {
      const res = await fetch('/api/pwa/messages?phone=' + encodeURIComponent(profile.phone));
      const d = await res.json();
      if (res.ok) {
        setMessages(d.messages || []);
        setCanMessage(d.canMessage || false);
      }
    } catch {}
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (messages?.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setErr('');
    try {
      const res = await fetch('/api/pwa/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone, name: profile.name, message: text.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || 'Failed to send'); return; }
      setText('');
      await load();
    } catch {
      setErr('Network error. Try again.');
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafaf7' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'calc(16px + env(safe-area-inset-top))',
        borderBottom: '1px solid #e5e7eb', background: '#fff',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#2d8653', fontWeight: 600, padding: 0 }}
        >
          &larr; Home
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#0f1a14' }}>Messages</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>One Love Outdoors</div>
        </div>
        <div />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {messages === null && (
          <p style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 40 }}>Loading...</p>
        )}

        {messages !== null && messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, padding: '0 24px' }}>
            <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No messages yet.</p>
            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>
              {canMessage
                ? 'Questions? Send us a note below.'
                : 'Book a service to start a conversation.'}
            </p>
          </div>
        )}

        {messages !== null && messages.map((msg, i) => {
          const isCustomer = msg.sender === 'member';
          return (
            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  padding: '9px 13px',
                  borderRadius: isCustomer ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isCustomer ? '#1a3328' : '#fff',
                  border: isCustomer ? 'none' : '1px solid #e5e7eb',
                  color: isCustomer ? '#fff' : '#0f1a14',
                  fontSize: 15,
                  lineHeight: 1.5,
                }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, textAlign: isCustomer ? 'right' : 'left' }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canMessage && (
        <div style={{ padding: '10px 16px 16px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
          {err && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 6 }}>{err}</p>}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Message..."
              rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              style={{
                flex: 1, padding: '10px 13px', border: '1px solid #d1d5db', borderRadius: 20,
                fontSize: 15, outline: 'none', resize: 'none', fontFamily: 'inherit',
                lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              style={{
                padding: '10px 18px', background: (!text.trim() || sending) ? '#9ca3af' : '#1a3328',
                color: '#fff', border: 'none', borderRadius: 20, fontSize: 15,
                cursor: (!text.trim() || sending) ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {!canMessage && messages !== null && (
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
            Book a service to start a conversation.
          </p>
        </div>
      )}
    </div>
  );
}
