'use client';
import { useState, useEffect } from 'react';
import { GOOGLE_REVIEW_URL } from '../../../lib/config';

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

export default function EmbedService() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Auto-resize: send height to parent frame
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function sendHeight() {
      window.parent.postMessage({ type: 'lom-resize', height: document.documentElement.scrollHeight }, '*');
    }
    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.documentElement);
    sendHeight();
    return () => ro.disconnect();
  }, []);

  function setField(setter, key) {
    return e => {
      setter(e.target.value);
      setErrors(er => ({ ...er, [key]: '' }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Required';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) errs.phone = digits.length === 0 ? 'Required' : 'At least 10 digits';
    if (!message.trim()) errs.message = "Tell us what's going on.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setSubmitErr('');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitErr(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setSubmitErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const container = {
    fontFamily: 'var(--ol-font-body)',
    background: 'var(--ol-bg)',
    padding: '20px 16px 28px',
    maxWidth: 560,
    margin: '0 auto',
    color: 'var(--ol-text)',
  };

  if (done) {
    return (
      <div style={container}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 8, fontFamily: 'var(--ol-font-heading)' }}>
            Got it.
          </h3>
          <p style={{ color: 'var(--ol-text-muted)', fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
            {"We'll text or call you shortly."}
          </p>
          <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-lg)', padding: '16px 16px 20px', textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', marginBottom: 12 }}>
              Save our number for quick questions.
            </p>
            <button
              type="button"
              onClick={saveContact}
              style={{ display: 'block', width: '100%', padding: '12px 0', background: 'var(--ol-btn-bg)', color: 'var(--ol-btn-text)', border: 'none', borderRadius: 'var(--ol-radius-md)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}
            >
              Save our contact
            </button>
          </div>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', marginBottom: 10 }}>
              While you wait — if a friend&apos;s bike needs love, send them our way.
            </p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', padding: '13px 0', background: 'var(--ol-btn-bg)', color: 'var(--ol-btn-text)', borderRadius: 'var(--ol-radius-md)', fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center', letterSpacing: '0.02em' }}
            >
              Leave a review →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', textAlign: 'center', margin: '0 0 20px', fontFamily: 'var(--ol-font-heading)' }}>
        Ride better tomorrow.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ol-text-muted)', marginBottom: 4, letterSpacing: '0.01em' }}>
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={setField(setName, 'name')}
            placeholder="Your name"
            style={{
              width: '100%', padding: '11px 14px', border: errors.name ? '2px solid var(--ol-border-error)' : '1px solid var(--ol-border)',
              borderRadius: 'var(--ol-radius-md)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', background: 'var(--ol-bg-input)', color: 'var(--ol-text)',
            }}
          />
          {errors.name && <span style={{ fontSize: 12, color: 'var(--ol-border-error)', marginTop: 3, display: 'block' }}>{errors.name}</span>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ol-text-muted)', marginBottom: 4, letterSpacing: '0.01em' }}>
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={setField(setPhone, 'phone')}
            placeholder="(xxx) xxx-xxxx"
            style={{
              width: '100%', padding: '11px 14px', border: errors.phone ? '2px solid var(--ol-border-error)' : '1px solid var(--ol-border)',
              borderRadius: 'var(--ol-radius-md)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', background: 'var(--ol-bg-input)', color: 'var(--ol-text)',
            }}
          />
          {errors.phone && <span style={{ fontSize: 12, color: 'var(--ol-border-error)', marginTop: 3, display: 'block' }}>{errors.phone}</span>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ol-text-muted)', marginBottom: 4, letterSpacing: '0.01em' }}>
            {"What's going on with your bike?"}
          </label>
          <textarea
            value={message}
            onChange={setField(setMessage, 'message')}
            placeholder="Squeaky brakes, needs a tune, flat tire — whatever it is."
            rows={4}
            style={{
              width: '100%', padding: '13px 14px', border: errors.message ? '2px solid var(--ol-border-error)' : '1px solid var(--ol-border)',
              borderRadius: 'var(--ol-radius-md)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', background: 'var(--ol-bg-input)', color: 'var(--ol-text)',
            }}
          />
          {errors.message && <span style={{ fontSize: 12, color: 'var(--ol-border-error)', marginTop: 3, display: 'block' }}>{errors.message}</span>}
        </div>

        {submitErr && <p style={{ fontSize: 12, color: 'var(--ol-border-error)', marginBottom: 10 }}>{submitErr}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', padding: '13px 0',
            background: submitting ? 'var(--ol-btn-disabled)' : 'var(--ol-btn-bg)', color: 'var(--ol-btn-text)', border: 'none',
            borderRadius: 'var(--ol-radius-md)', fontSize: 15, fontWeight: 600, cursor: submitting ? 'default' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.04em',
          }}
        >
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ol-text-hint)', marginTop: 18 }}>
        Rather just text us?{' '}
        <a href="sms:8602817888" style={{ color: 'var(--ol-text-hint)', textDecoration: 'underline' }}>(860) 281-7888</a>
      </p>

      <p style={{ textAlign: 'center', marginTop: 20 }}>
        <a href="/embed/service/detailed" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--ol-text-hint)', textDecoration: 'underline' }}>
          Want to give us more details?
        </a>
      </p>
    </div>
  );
}
