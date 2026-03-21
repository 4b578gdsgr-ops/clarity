'use client';
import { useState } from 'react';

const DEFAULT_SUBJECT = 'Quick heads up on membership billing';
const DEFAULT_BODY = `Hey — thanks for being one of the first to join. Seriously.

We jumped the gun on how we set up billing and need to switch it over to our main site. Your membership is good this month, no question. We're going to cancel the Square charge on our end.

When you get a chance, sign up through here instead:
https://oneloveoutdoors.org/onelove-members-only

Same deal, same price. Just a better setup. And if you have any trouble, just reply to this email.

Being early means a lot to us. You're the reason this thing gets off the ground.

— One Love`;

export default function SendEmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  const recipients = to.split(',').map(s => s.trim()).filter(Boolean);
  const canSend = recipients.length > 0 && subject.trim() && body.trim();

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject: subject.trim(), text: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      const msg = data.warning
        ? `Partial send — ${data.warning}`
        : `Sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`;
      setResult({ ok: !data.warning, message: msg });
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', paddingBottom: 60 }}>
      <div style={{ background: '#0f1a14', padding: '14px 20px' }}>
        <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 15 }}>Admin — Send Email</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To
            </label>
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="email@example.com, another@example.com"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            {recipients.length > 0 && (
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 5, marginBottom: 0 }}>
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}: {recipients.join(', ')}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Body
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={14}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {result && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: result.ok ? '#f0fdf4' : '#fef2f2',
              border: '1px solid ' + (result.ok ? '#bbf7d0' : '#fecaca'),
              color: result.ok ? '#166534' : '#dc2626',
            }}>
              {result.message}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            style={{
              padding: '12px 0', borderRadius: 9, fontSize: 15, fontWeight: 700,
              background: canSend ? '#1a3328' : '#9ca3af',
              color: '#fff', border: 'none', cursor: canSend ? 'pointer' : 'default',
            }}
          >
            {sending ? 'Sending...' : `Send${recipients.length > 1 ? ' (' + recipients.length + ')' : ''}`}
          </button>

        </div>
      </div>
    </main>
  );
}
