'use client';
import { useState, useEffect, useRef } from 'react';
import { uploadMessagePhoto } from '../../../lib/uploadMessagePhoto';

export default function PwaMessages({ profile, onBack }) {
  const [messages, setMessages] = useState(null);
  const [canMessage, setCanMessage] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const photoInputRef = useRef(null);

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

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  function clearPhoto() {
    setPhotoFile(null);
    if (photoPreview) { URL.revokeObjectURL(photoPreview); setPhotoPreview(null); }
  }

  async function handleSend(e) {
    e.preventDefault();
    if ((!text.trim() && !photoFile) || sending) return;
    setSending(true);
    setErr('');
    let photo_url = null;
    if (photoFile) {
      try { photo_url = await uploadMessagePhoto(photoFile); }
      catch { setErr('Photo upload failed. Try again.'); setSending(false); return; }
    }
    try {
      const res = await fetch('/api/pwa/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone, name: profile.name, message: text.trim(), photo_url }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || 'Failed to send'); return; }
      setText('');
      clearPhoto();
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
              {canMessage ? 'Questions? Send us a note below.' : 'Book a service to start a conversation.'}
            </p>
          </div>
        )}

        {messages !== null && messages.map((msg, i) => {
          const isCustomer = msg.sender === 'member';
          return (
            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  padding: msg.photo_url ? '4px' : '9px 13px',
                  borderRadius: isCustomer ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isCustomer ? '#1a3328' : '#fff',
                  border: isCustomer ? 'none' : '1px solid #e5e7eb',
                  color: isCustomer ? '#fff' : '#0f1a14',
                  fontSize: 15, lineHeight: 1.5,
                }}>
                  {msg.photo_url && (
                    <a href={msg.photo_url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                      <img src={msg.photo_url} alt="" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 12, display: 'block', cursor: 'pointer' }} />
                    </a>
                  )}
                  {msg.message && (
                    <div style={{ padding: msg.photo_url ? '6px 8px 4px' : 0 }}>{msg.message}</div>
                  )}
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
          {photoPreview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <img src={photoPreview} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <button type="button" onClick={clearPhoto} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}
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
            <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoSelect} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              style={{
                padding: '10px 11px', background: photoFile ? '#f0fdf4' : '#f9fafb',
                border: '1px solid ' + (photoFile ? '#86efac' : '#d1d5db'),
                borderRadius: 20, cursor: 'pointer', lineHeight: 1,
                color: photoFile ? '#16a34a' : '#6b7280',
              }}
              title="Attach photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button
              type="submit"
              disabled={sending || (!text.trim() && !photoFile)}
              style={{
                padding: '10px 18px',
                background: (!text.trim() && !photoFile) || sending ? '#9ca3af' : '#1a3328',
                color: '#fff', border: 'none', borderRadius: 20, fontSize: 15,
                cursor: (!text.trim() && !photoFile) || sending ? 'default' : 'pointer',
                fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {!canMessage && messages !== null && (
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Book a service to start a conversation.</p>
        </div>
      )}
    </div>
  );
}
