'use client';
import { useState } from 'react';

const SERVICE_URL  = 'https://oneloveoutdoors.org/schedule-service-app';
const DIAGNOSTIC_URL = 'https://oneloveoutdoors.org/repair-or-replace';

const PRICING = [
  { service: 'Tune-up',           price: '$95',       note: 'pickup/delivery included' },
  { service: 'Brake service',     price: '$40–120',   note: 'pickup/delivery included' },
  { service: 'Wheel true',        price: '$40',       note: 'pickup/delivery included' },
  { service: 'Suspension service',price: '$150+',     note: 'pickup/delivery included' },
  { service: 'Full overhaul',     price: '$200+',     note: 'pickup/delivery included' },
  { service: 'New bike assembly', price: 'Quoted',    note: 'per bike' },
];

export default function MembersDashboard() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState('');

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/member-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), email: email.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setMessage('');
      setEmail('');
    } catch {
      setSendErr('Something went wrong. Try again or email us directly.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ fontFamily: 'var(--ol-font-body)', color: 'var(--ol-text)', padding: '24px 16px 48px', maxWidth: 560, margin: '0 auto' }}>

      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 6, marginTop: 0 }}>
          One Love Member
        </p>
        <h1 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 26, fontWeight: 700, color: 'var(--ol-text)', margin: '0 0 6px' }}>
          Welcome back.
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
      <div style={{ background: '#fff', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '20px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 6, marginTop: 0 }}>
          Message Us
        </p>
        <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', marginBottom: 14, marginTop: 0, lineHeight: 1.5 }}>
          Questions, parts requests, or just want to talk bikes.
        </p>
        {sent ? (
          <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-md)', padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--ol-accent)', fontWeight: 600, margin: 0 }}>
              Sent. We'll get back to you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--ol-border)',
                borderRadius: 'var(--ol-radius-md)', fontSize: 14, outline: 'none',
                resize: 'vertical', lineHeight: 1.5, color: 'var(--ol-text)',
                background: 'var(--ol-bg-input)', boxSizing: 'border-box',
              }}
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email (optional — so we can reply)"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--ol-border)',
                borderRadius: 'var(--ol-radius-md)', fontSize: 14, outline: 'none',
                color: 'var(--ol-text)', background: 'var(--ol-bg-input)', boxSizing: 'border-box',
              }}
            />
            {sendErr && (
              <p style={{ fontSize: 13, color: 'var(--ol-border-error)', margin: 0 }}>{sendErr}</p>
            )}
            <button
              type="submit"
              disabled={!message.trim() || sending}
              style={{
                padding: '11px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 14,
                fontWeight: 700, color: 'var(--ol-btn-text)',
                background: message.trim() ? 'var(--ol-btn-bg)' : 'var(--ol-btn-disabled)',
                border: 'none', cursor: message.trim() ? 'pointer' : 'default',
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>

      {/* Member Pricing */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 12, marginTop: 0 }}>
          Your member rates
        </p>
        <div style={{ background: '#fff', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', overflow: 'hidden' }}>
          {PRICING.map((item, i) => (
            <div key={item.service} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < PRICING.length - 1 ? '1px solid var(--ol-border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ol-text)' }}>{item.service}</div>
                <div style={{ fontSize: 11, color: 'var(--ol-text-hint)', marginTop: 2 }}>{item.note}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ol-accent)', flexShrink: 0, marginLeft: 12 }}>{item.price}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
          Parts at preferred pricing. No pickup fees. Ever.
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
