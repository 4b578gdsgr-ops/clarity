'use client';

import { useState, useRef } from 'react';
import { diagnose } from '../../../lib/bikeRepairEngine';

const BRAND_GROUPS = [
  {
    label: 'Premium / Artisan',
    brands: ['Bianchi', 'BMC', 'Cervelo', 'Colnago', 'Ibis', 'Litespeed', 'Lynskey', 'Moots', 'Pinarello', 'Pivot', 'Santa Cruz', 'Seven', 'Yeti'],
  },
  {
    label: 'Quality Brands',
    brands: ['Cannondale', 'Canyon', 'Giant', 'Kona', 'Marin', 'Norco', 'Orbea', 'Rocky Mountain', 'Salsa', 'Scott', 'Specialized', 'Surly', 'Trek'],
  },
  {
    label: 'Other',
    brands: ["I don't know", 'Other', 'Department store / big box'],
  },
];

const AGES = [
  { id: 'under2',  label: 'Less than 2 years' },
  { id: '2to5',   label: '2–5 years' },
  { id: '5to10',  label: '5–10 years' },
  { id: '10to20', label: '10–20 years' },
  { id: '20plus', label: '20+ years / vintage' },
];

const ISSUES = [
  { id: 'shifting',     label: 'Shifting issues' },
  { id: 'brakes',       label: 'Brake problems' },
  { id: 'wheels',       label: 'Wheels out of true / need rebuild' },
  { id: 'bb_noise',     label: 'Bottom bracket noise or creak' },
  { id: 'headset',      label: 'Headset issues' },
  { id: 'suspension',   label: 'Fork or shock service needed' },
  { id: 'frame_damage', label: 'Frame damage or crack' },
  { id: 'drivetrain',   label: 'Chain / cassette / chainring worn' },
  { id: 'tuneup',       label: 'General tune-up needed' },
  { id: 'feels_wrong',  label: 'It just feels wrong' },
  { id: 'other',        label: "Something else / not sure" },
];

const RIDING = [
  { id: 'rarely',   label: 'Rarely' },
  { id: 'monthly',  label: 'Few times a month' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'multiple', label: 'Multiple times a week' },
];

const SERVICE_URL    = 'https://oneloveoutdoors.org/schedule-service-app';
const CONTACT_EMAIL  = 'mailto:service@oneloveoutdoors.org';

const CTA = {
  fix: {
    primary:   { label: 'Book a pickup →', href: SERVICE_URL },
    secondary: { label: 'Learn about membership', href: 'https://oneloveoutdoors.org/member-site-homepage-2-2-1' },
    note: 'Members get priority service and free pickups.',
  },
  upgrade: {
    primary:   { label: 'Book a pickup →', href: SERVICE_URL },
    secondary: { label: 'Talk to us about custom builds', href: CONTACT_EMAIL },
    note: 'A good mechanic can handle most of this. We do custom builds and hand-built wheels if you need to go further.',
  },
  local_shop: {
    primary:   { label: 'Book a pickup →', href: SERVICE_URL },
    secondary: null,
    note: 'Ask for a frame inspection — most shops do this for free.',
  },
  new_bike: {
    primary:   { label: 'Book a pickup →', href: SERVICE_URL },
    secondary: { label: 'Talk to us about custom builds', href: CONTACT_EMAIL },
    note: 'Sometimes the right move is a fresh start.',
  },
};

const S = {
  page:       { fontFamily: 'var(--ol-font-body)', background: 'var(--ol-bg)', color: 'var(--ol-text)', padding: '20px 16px 40px', maxWidth: 560, margin: '0 auto' },
  label:      { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-text-hint)', display: 'block', marginBottom: 8 },
  card:       { background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '16px 18px', marginBottom: 16 },
  optBtn:     (selected) => ({
    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
    borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer', marginBottom: 6,
    background: selected ? 'var(--ol-accent-light)' : 'var(--ol-bg-callout)',
    border: selected ? '1px solid var(--ol-accent-border)' : '1px solid var(--ol-border)',
    color: 'var(--ol-text)',
  }),
  checkBtn:   (selected) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer', marginBottom: 6,
    background: selected ? 'var(--ol-accent-light)' : 'var(--ol-bg-callout)',
    border: selected ? '1px solid var(--ol-accent-border)' : '1px solid var(--ol-border)',
    color: 'var(--ol-text)',
  }),
  rideBtn:    (selected) => ({
    flex: 1, padding: '9px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer',
    background: selected ? 'var(--ol-chip-selected-bg)' : 'var(--ol-chip-bg)',
    color: selected ? 'var(--ol-chip-selected-text)' : 'var(--ol-text-muted)',
    border: selected ? '1px solid var(--ol-chip-selected-border)' : '1px solid var(--ol-chip-border)',
    textAlign: 'center',
  }),
  submitBtn:  (enabled) => ({
    display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)',
    fontSize: 15, fontWeight: 700, cursor: enabled ? 'pointer' : 'default',
    background: enabled ? 'var(--ol-btn-bg)' : 'var(--ol-btn-disabled)',
    color: 'var(--ol-btn-text)', border: 'none', marginTop: 4,
  }),
  primaryBtn: { display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 15, fontWeight: 700, color: 'var(--ol-btn-text)', background: 'var(--ol-btn-bg)', textAlign: 'center', textDecoration: 'none', marginBottom: 8, boxSizing: 'border-box' },
  secondaryBtn: { display: 'block', width: '100%', padding: '10px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--ol-accent)', background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  select:     { width: '100%', padding: '10px 12px', borderRadius: 'var(--ol-radius-md)', fontSize: 13, background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', color: 'var(--ol-text)', outline: 'none', marginBottom: 0 },
};

export default function EmbedRepairOrReplace() {
  const [brand, setBrand]   = useState('');
  const [age, setAge]       = useState('');
  const [issues, setIssues] = useState([]);
  const [riding, setRiding] = useState('');
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const canSubmit = brand && age && issues.length > 0 && riding;

  const toggleIssue = (id) =>
    setIssues(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSubmit = () => {
    const r = diagnose({ brand, age, issues, riding });
    setResult(r);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const reset = () => {
    setResult(null);
    setBrand(''); setAge(''); setIssues([]); setRiding('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cta = result ? (CTA[result.ctaVerdict] || CTA.fix) : null;

  return (
    <div style={S.page}>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 8 }}>
        Repair or Replace?
      </p>
      <h1 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', lineHeight: 1.3, marginBottom: 8, marginTop: 0 }}>
        Is that bike worth fixing?
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
        Be honest — how long has it been sitting there? Tell us what's wrong. We'll tell you what to do.
      </p>

      {/* Form */}
      <div style={S.card}>

        {/* Brand */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>What brand is it?</label>
          <select value={brand} onChange={e => setBrand(e.target.value)} style={{ ...S.select, color: brand ? 'var(--ol-text)' : 'var(--ol-text-hint)' }}>
            <option value="">Select brand...</option>
            {BRAND_GROUPS.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.brands.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Age */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>How old is it?</label>
          {AGES.map(a => (
            <button key={a.id} onClick={() => setAge(a.id)} style={S.optBtn(age === a.id)}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Issues */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...S.label, marginBottom: 4 }}>
            What's wrong?{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>Check everything that applies.</span>
          </label>
          {ISSUES.map(issue => (
            <button key={issue.id} onClick={() => toggleIssue(issue.id)} style={S.checkBtn(issues.includes(issue.id))}>
              <span style={{
                width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                background: issues.includes(issue.id) ? 'var(--ol-accent)' : 'var(--ol-bg-input)',
                border: issues.includes(issue.id) ? '1px solid var(--ol-accent)' : '1px solid var(--ol-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {issues.includes(issue.id) && (
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {issue.label}
            </button>
          ))}
        </div>

        {/* Riding frequency */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>How much do you ride?</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RIDING.map(r => (
              <button key={r.id} onClick={() => setRiding(r.id)} style={{ ...S.rideBtn(riding === r.id), flex: '1 1 calc(50% - 3px)' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit} style={S.submitBtn(canSubmit)}>
          Tell me what to do →
        </button>
      </div>

      {/* Result */}
      {result && (
        <div ref={resultRef} style={{ marginBottom: 32 }}>

          {/* Verdict banner */}
          <div style={{ background: result.accentBg, border: `1px solid ${result.color}30`, borderRadius: 'var(--ol-radius-lg)', padding: '16px 18px', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{result.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 17, fontWeight: 700, color: result.color, marginBottom: 4, lineHeight: 1.3 }}>
                  {result.headline}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)', marginBottom: 8 }}>
                  {result.subheadline}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {result.body}
                </p>
                {result.estimatedCost && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: result.color }}>
                    {result.estimatedCost}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Issue notes */}
          {result.repairNotes.length > 0 && (
            <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '12px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-text-hint)', marginBottom: 8, marginTop: 0 }}>
                What each issue actually costs
              </p>
              {result.repairNotes.map((note, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 6 }}>
                  <span style={{ color: 'var(--ol-accent)', flexShrink: 0 }}>♥</span>
                  {note}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px', marginBottom: 12 }}>
            <a href={cta.primary.href} target="_blank" rel="noopener noreferrer" style={S.primaryBtn}>{cta.primary.label}</a>
            {cta.secondary && (
              <a href={cta.secondary.href} target="_blank" rel="noopener noreferrer" style={S.secondaryBtn}>{cta.secondary.label}</a>
            )}
            {cta.note && (
              <p style={{ fontSize: 11, color: 'var(--ol-text-hint)', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>{cta.note}</p>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={reset} style={{ fontSize: 12, color: 'var(--ol-text-hint)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
