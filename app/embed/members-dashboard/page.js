'use client';
import { useState, useEffect, useRef } from 'react';

const SERVICE_URL    = 'https://oneloveoutdoors.org/schedule-service-app';
const DIAGNOSTIC_URL = 'https://oneloveoutdoors.org/repair-or-replace';
const STORAGE_KEY    = 'ol_member_thread';


function fmt(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function MembersDashboard() {
  // Thread state
  const [threadId, setThreadId] = useState(null);
  const [storedName, setStoredName] = useState('');
  const [storedEmail, setStoredEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [threadLoaded, setThreadLoaded] = useState(false);

  // New message form
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const bottomRef = useRef(null);
  const intervalRef = useRef(null);

  // Load stored thread on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored?.threadId) {
        setThreadId(stored.threadId);
        setStoredName(stored.name || '');
        setStoredEmail(stored.email || '');
        setName(stored.name || '');
        loadThread(stored.threadId);
      }
    } catch {}
    setThreadLoaded(true);
  }, []);

  // Poll for replies when thread is active
  useEffect(() => {
    if (!threadId) return;
    intervalRef.current = setInterval(() => loadThread(threadId), 10000);
    return () => clearInterval(intervalRef.current);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadThread(tid) {
    try {
      const res = await fetch('/api/member-messages?thread_id=' + tid);
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch {}
  }

  async function handleSend(e) {
    e.preventDefault();
    const useName = name.trim();
    const useEmail = storedEmail;
    if (!useName || !message.trim() || sending) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/member-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: useName,
          message: message.trim(),
          email: useEmail || null,
          thread_id: threadId || undefined,
          sender: 'member',
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const tid = data.thread_id;
      if (!threadId) {
        setThreadId(tid);
        setStoredName(useName);
        setStoredEmail(useEmail);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ threadId: tid, name: useName, email: useEmail }));
        } catch {}
      }
      setMessage('');
      await loadThread(tid);
    } catch {
      setSendErr('Something went wrong. Try again or email us directly.');
    } finally {
      setSending(false);
    }
  }

  const isReady = name.trim() && message.trim();

  return (
    <div style={{ fontFamily: 'var(--ol-font-body)', color: 'var(--ol-text)', padding: '24px 16px 48px', maxWidth: 560, margin: '0 auto' }}>

      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 6, marginTop: 0 }}>
          One Love Member
        </p>
        <h1 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 26, fontWeight: 700, color: 'var(--ol-text)', margin: '0 0 6px' }}>
          Welcome back{storedName ? ', ' + storedName.split(' ')[0] : ''}.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', margin: 0, lineHeight: 1.5 }}>
          Everything you need is right here.
        </p>
      </div>

      {/* Book Service */}
      <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-lg)', padding: '20px 20px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 10, marginTop: 0 }}>
          Priority Service
        </p>
        <a
          href={SERVICE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', width: '100%', padding: '14px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 15, fontWeight: 700, color: 'var(--ol-btn-text)', background: 'var(--ol-btn-bg)', textAlign: 'center', textDecoration: 'none', letterSpacing: '0.02em', boxSizing: 'border-box' }}
        >
          Book service — free pickup/delivery →
        </a>
        <p style={{ fontSize: 12, color: 'var(--ol-accent)', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
          Remember to check <strong>"I'm a member"</strong> when booking.
        </p>
      </div>

      {/* Message Us */}
      <div style={{ background: '#fff', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: messages.length > 0 ? '1px solid var(--ol-border)' : 'none' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 4, marginTop: 0 }}>
            Message Us
          </p>
          <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', marginBottom: 0, marginTop: 0, lineHeight: 1.5 }}>
            Questions, parts requests, or just want to talk bikes.
          </p>
        </div>

        {/* Thread history */}
        {threadLoaded && messages.length > 0 && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', background: '#fafafa' }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'member' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                  background: m.sender === 'member' ? '#1a1a18' : '#f3f4f6',
                  color: m.sender === 'member' ? '#fff' : '#111827',
                }}>
                  {m.message}
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3, textAlign: 'right' }}>
                    {m.sender === 'admin' ? 'One Love · ' : ''}{fmt(m.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSend} style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: messages.length > 0 ? '1px solid var(--ol-border)' : 'none' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name *"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)', fontSize: 14, outline: 'none', color: 'var(--ol-text)', background: 'var(--ol-bg-input)', boxSizing: 'border-box' }}
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={messages.length > 0 ? 'Reply...' : "What's on your mind?"}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5, color: 'var(--ol-text)', background: 'var(--ol-bg-input)', boxSizing: 'border-box' }}
          />
          {sendErr && <p style={{ fontSize: 13, color: 'var(--ol-border-error)', margin: 0 }}>{sendErr}</p>}
          <button
            type="submit"
            disabled={!isReady || sending}
            style={{ padding: '11px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 14, fontWeight: 700, color: 'var(--ol-btn-text)', background: isReady ? 'var(--ol-btn-bg)' : 'var(--ol-btn-disabled)', border: 'none', cursor: isReady ? 'pointer' : 'default' }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Member Pricing */}
      <div style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)' }}>
        <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', margin: 0, lineHeight: 1.7 }}>
          As a member, pickup and delivery is always free. You get preferred pricing on parts and labor. No surprises — we quote everything before we start.
        </p>
      </div>

      {/* Repair or Replace */}
      <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '18px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', marginBottom: 12, marginTop: 0, lineHeight: 1.5 }}>
          Not sure what your bike needs?
        </p>
        <a
          href={DIAGNOSTIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 14, fontWeight: 700, color: 'var(--ol-accent)', textDecoration: 'none' }}
        >
          Try our diagnostic tool →
        </a>
      </div>

      {/* Contact */}
      <div style={{ paddingTop: 20, borderTop: '1px solid var(--ol-border)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', margin: 0 }}>
          Direct line:{' '}
          <a href="mailto:service@oneloveoutdoors.org" style={{ color: 'var(--ol-accent)', textDecoration: 'none', fontWeight: 600 }}>
            service@oneloveoutdoors.org
          </a>
        </p>
      </div>

    </div>
  );
}
