'use client';

import { useState } from 'react';

const WHY_CUSTOM = [
  {
    title: 'Every part chosen with intention',
    body: `Custom builds mean every part is chosen with intention. Independent frame builders working in small batches. Components selected for how you ride, not what came in the box. Whether it's a titanium frame from a two-person shop or a build-up around a frame you already love — the difference is in the details.`,
  },
  {
    title: 'Built for you, not an average body',
    body: `A frame that will outlive every trend. Components chosen because they're right for how you actually ride. Off-the-shelf bikes are built for a range. This one is built for you specifically.`,
  },
  {
    title: 'Your money stays in the craft',
    body: `Independent frame builders and component makers like Hope, Chris King, and Wolf Tooth are owned by the people who run them — people who care deeply about what they make. When you buy a custom build, a meaningful share of that money goes to small operations making real decisions about real products.`,
  },
  {
    title: 'This is what bikes were before they became content',
    body: `Wheels built by hand with your weight, your terrain, your riding style in mind. A well-specced custom build outlasts most complete bikes by a decade or more. Buy once, buy right.`,
  },
  {
    title: 'A small operation, not a factory',
    body: `We specialize in titanium and steel frames, hand-built wheels, and carefully spec'd builds. If you know exactly what you want, we'll source it and build it right. If you're not sure yet, we'll figure it out together.`,
  },
];

const BUDGET_RANGES = [
  '$3,000–$5,000',
  '$5,000–$7,000',
  '$7,000–$10,000',
  '$10,000–$15,000',
  '$15,000+',
];

const RIDING_STYLES = [
  'Trail / All-mountain',
  'Enduro / Aggressive',
  'XC / Cross-country',
  'Road / Endurance',
  'Gravel / Adventure',
  'Bikepacking / Touring',
  'Commuter / Urban',
  'Mixed / Not sure yet',
];

export default function EmbedCustomBuilds() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', budget_range: '', riding_style: '', dream_bike_description: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/custom-build-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bike_types: [] }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 'var(--ol-radius-md)', fontSize: 13, background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', color: 'var(--ol-text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--ol-font-body)' };
  const canSubmit = form.name && form.email;

  return (
    <div style={{ fontFamily: 'var(--ol-font-body)', background: 'var(--ol-bg)', color: 'var(--ol-text)', padding: '20px 16px 40px', maxWidth: 560, margin: '0 auto' }}>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 8 }}>
        One Love Custom Builds
      </p>
      <h1 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', lineHeight: 1.3, marginBottom: 8, marginTop: 0 }}>
        Mass production went one way. We went the other.
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
        Every build starts with a conversation — what you ride, where you ride it, what matters. We listen first.
      </p>

      {/* Why custom */}
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-text-hint)', marginBottom: 10 }}>
        Why a custom build?
      </p>
      {WHY_CUSTOM.map(item => (
        <div key={item.title} style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)', padding: '10px 14px', marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)', marginBottom: 3, marginTop: 0 }}>{item.title}</p>
          <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', lineHeight: 1.5, margin: 0 }}>{item.body}</p>
        </div>
      ))}

      {/* Who we work with */}
      <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px', margin: '20px 0' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-accent)', marginBottom: 8, marginTop: 0 }}>
          Who we work with
        </p>
        <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 8, marginTop: 0 }}>
          We work with independent frame builders — small operations making titanium, steel, and carbon frames in small batches. Someone who actually cares about bikes is making the decisions, and the craft shows in the work.
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ol-accent)', margin: 0 }}>
          Ask us who we're working with right now — the list changes as we find builders worth believing in.
        </p>
      </div>

      {/* How it works */}
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-text-hint)', marginBottom: 10 }}>
        How it works
      </p>
      {[
        { step: '01', title: 'Start the conversation', body: "Fill out the form below. Tell us what you're after — or just that you're curious." },
        { step: '02', title: 'We talk', body: 'We reach back within 48 hours. Phone, text, email — whatever works. No sales pitch.' },
        { step: '03', title: 'We spec it together', body: 'Frame, wheels, drivetrain, components. We explain every choice.' },
        { step: '04', title: 'We build it', body: "We source from our network of small builders and assemble it to your fit. You pick it up or we ship." },
      ].map(s => (
        <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: 'var(--ol-accent)', flexShrink: 0, width: 22, paddingTop: 1 }}>{s.step}</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)', marginBottom: 2, marginTop: 0 }}>{s.title}</p>
            <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', lineHeight: 1.5, margin: 0 }}>{s.body}</p>
          </div>
        </div>
      ))}

      {/* Form */}
      <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '16px 18px', marginTop: 24 }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>♥</div>
            <p style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 6, marginTop: 0 }}>
              We'll be in touch within 48 hours.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, margin: 0 }}>
              Every custom build starts with a conversation. We're looking forward to it.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--ol-text)', textAlign: 'center', marginBottom: 4, marginTop: 0 }}>
              Tell us about your dream bike.
            </p>
            <p style={{ fontSize: 12, color: 'var(--ol-text-hint)', textAlign: 'center', marginBottom: 16, marginTop: 0 }}>
              No commitment. Just a conversation.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ol-text-muted)', marginBottom: 4 }}>Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ol-text-muted)', marginBottom: 4 }}>Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ol-text-muted)', marginBottom: 4 }}>Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(860) 555-0100" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ol-text-muted)', marginBottom: 4 }}>Budget range</label>
                <select value={form.budget_range} onChange={e => set('budget_range', e.target.value)} style={{ ...inputStyle, color: form.budget_range ? 'var(--ol-text)' : 'var(--ol-text-hint)' }}>
                  <option value="">Select...</option>
                  {BUDGET_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ol-text-muted)', marginBottom: 4 }}>Riding style</label>
                <select value={form.riding_style} onChange={e => set('riding_style', e.target.value)} style={{ ...inputStyle, color: form.riding_style ? 'var(--ol-text)' : 'var(--ol-text-hint)' }}>
                  <option value="">Select...</option>
                  {RIDING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ol-text-muted)', marginBottom: 4 }}>Tell us about your dream bike</label>
              <textarea value={form.dream_bike_description} onChange={e => set('dream_bike_description', e.target.value)}
                placeholder="Anything you know: geometry preferences, brands you like, how you plan to use it, past bikes, what you loved or hated..."
                rows={4}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
            </div>

            {error && <p style={{ fontSize: 12, color: 'var(--ol-border-error)', marginBottom: 8 }}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading || !canSubmit} style={{
              display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)',
              fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default',
              background: canSubmit ? 'var(--ol-btn-bg)' : 'var(--ol-btn-disabled)',
              color: 'var(--ol-btn-text)', border: 'none',
            }}>
              {loading ? 'Sending...' : 'Start the conversation →'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--ol-text-hint)', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
              No commitment. We'll reach back within 48 hours.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
