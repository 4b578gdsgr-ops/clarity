'use client';
import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'ol_app_chat';

function fmt(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function MessagesPage() {
  const [threadId, setThreadId] = useState(null);
  const [storedName, setStoredName] = useState('');
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const threadRef = useRef(null);
  const mountedRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored?.threadId) {
        setThreadId(stored.threadId);
        setStoredName(stored.name || '');
        setName(stored.name || '');
        loadThread(stored.threadId);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!threadId) return;
    intervalRef.current = setInterval(() => loadThread(threadId), 10000);
    return () => clearInterval(intervalRef.current);
  }, [threadId]);

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
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
    if (!useName || !text.trim() || sending) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/member-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: useName,
          message: text.trim(),
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
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ threadId: tid, name: useName }));
        } catch {}
      }
      setText('');
      await loadThread(tid);
    } catch {
      setSendErr('Something went wrong — try again.');
    } finally {
      setSending(false);
    }
  }

  if (!loaded) return null;

  const showNameField = !storedName;
  const canSend = name.trim() && text.trim() && !sending;

  return (
    // 100dvh minus the 48px TopNav — locks the whole page to the visible viewport
    <main style={{ height: 'calc(100dvh - 48px)', background: '#fafaf7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#0f1a14', margin: '0 0 3px' }}>
            Message Us
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Questions about your bike? Need advice? Just ask.
          </p>
        </div>

        {/* Thread — only this section scrolls */}
        <div
          ref={threadRef}
          style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
        >
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: '0 0 6px' }}>
                  No messages yet.
                </p>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  We typically reply within a few hours.
                </p>
              </div>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender === 'member';
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? '#1a3328' : '#fff',
                  color: isMe ? '#f0fdf4' : '#111827',
                  border: isMe ? 'none' : '1px solid #e5e7eb',
                  fontSize: 15, lineHeight: 1.5,
                }}>
                  {msg.message}
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, padding: '0 4px' }}>
                  {isMe ? 'You' : 'One Love'} · {fmt(msg.created_at)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input — pinned to bottom, never scrolls away */}
        <div style={{ borderTop: '1px solid #e5e7eb', background: '#fff', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          {sendErr && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{sendErr}</p>}
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {showNameField && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10,
                  fontSize: 15, outline: 'none', fontFamily: 'inherit',
                }}
              />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10,
                  fontSize: 15, outline: 'none', fontFamily: 'inherit',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) handleSend(e); } }}
              />
              <button
                type="submit"
                disabled={!canSend}
                style={{
                  padding: '10px 18px', background: canSend ? '#1a3328' : '#d1d5db',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 15, cursor: canSend ? 'pointer' : 'default', fontWeight: 600,
                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}
