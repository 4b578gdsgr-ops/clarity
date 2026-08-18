'use client';
import { useState } from 'react';
import { GOOGLE_REVIEW_URL } from '../../lib/config';

function saveContact() {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:One Love Outdoors',
    'ORG:One Love Outdoors',
    'TEL;TYPE=WORK:8602817888',
    'EMAIL:service@oneloveoutdoors.org',
    'URL:https://oneloveoutdoors.org',
    'NOTE:Mobile bike service — text us anytime. oneloveoutdoors.org',
    'END:VCARD',
  ].join('\r\n');
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'one-love-outdoors.vcf';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ScheduleService() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) { setError('Tell us a bit about what you need.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#0f1a14', marginBottom: 16 }}>
            Got it.
          </h2>
          <p style={{ color: '#4b5563', fontSize: 17, lineHeight: 1.6, marginBottom: 28 }}>
            {"We'll text or call you shortly."}
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 20px 24px' }}>
            <p style={{ fontSize: 14, color: '#166534', marginBottom: 14 }}>
              Save our number for quick questions.
            </p>
            <button
              type="button"
              onClick={saveContact}
              style={{ display: 'block', width: '100%', padding: '12px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Save our contact
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
              While you wait — if a friend&apos;s bike needs love, send them our way.
            </p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', padding: '13px 0', background: '#1a3328', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Leave a review →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 16px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 700, color: '#0f1a14', textAlign: 'center', marginBottom: 28 }}>
          Ride better tomorrow.
        </h1>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={e => { setMessage(e.target.value); setError(''); }}
            placeholder="Tell us your name, address, and what's going on with your bike."
            rows={4}
            style={{
              width: '100%', padding: '14px 16px', border: error ? '2px solid #dc2626' : '1px solid #d1d5db',
              borderRadius: 12, fontSize: 16, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', background: '#fff',
            }}
          />
          {error && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '15px 0', marginTop: 16,
              background: submitting ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 17, fontWeight: 600, cursor: submitting ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 24 }}>
          Rather just text us?{' '}
          <a href="sms:8602817888" style={{ color: '#9ca3af', textDecoration: 'underline' }}>(860) 281-7888</a>
        </p>

        <p style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/schedule-service/detailed" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'underline' }}>
            Want to give us more details?
          </a>
        </p>
      </div>
    </main>
  );
}
