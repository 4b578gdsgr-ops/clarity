'use client';

import { useState, useRef } from 'react';
import { diagnose, BRANDS_FLAT, AGES, ISSUES, RIDING, FRAME_MATERIALS, SUSP_TYPES } from '../../../lib/bikeRepairEngine';
import { LOCAL_SHOPS } from '../../../lib/localShops';

const NEW_BIKE_BUDGETS = ['Under $500', '$500–$1,500', '$1,500–$3,000', '$3,000–$5,000', '$5,000+'];

const SERVICE_URL   = 'https://oneloveoutdoors.org/schedule-service-app';
const CONTACT_EMAIL = 'mailto:service@oneloveoutdoors.org';

const CTA = {
  fix: {
    primary:   { label: 'Book a pickup →', href: SERVICE_URL },
    secondary: { label: 'Learn about membership', href: 'https://oneloveoutdoors.org/onelove-members-only' },
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
    note: 'Ask for a frame inspection — we do this for free.',
  },
  new_bike: {
    primary:   { label: 'Book a pickup →', href: SERVICE_URL },
    secondary: { label: 'Talk to us about next steps', href: CONTACT_EMAIL },
    note: 'Sometimes the right move is a fresh start.',
  },
};

const S = {
  page:     { fontFamily: 'var(--ol-font-body)', background: 'var(--ol-bg)', color: 'var(--ol-text)', padding: '20px 16px 40px', maxWidth: 560, margin: '0 auto' },
  label:    { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-text-hint)', display: 'block', marginBottom: 8 },
  card:     { background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '16px 18px', marginBottom: 16 },
  optBtn:   (sel) => ({
    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
    borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer', marginBottom: 6,
    background: sel ? 'var(--ol-accent-light)' : 'var(--ol-bg-callout)',
    border: sel ? '1px solid var(--ol-accent-border)' : '1px solid var(--ol-border)',
    color: 'var(--ol-text)',
  }),
  gridBtn:  (sel) => ({
    padding: '9px 8px', borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer',
    background: sel ? 'var(--ol-accent-light)' : 'var(--ol-bg-callout)',
    border: sel ? '1px solid var(--ol-accent-border)' : '1px solid var(--ol-border)',
    color: 'var(--ol-text)', textAlign: 'center',
  }),
  checkBtn: (sel) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer', marginBottom: 6,
    background: sel ? 'var(--ol-accent-light)' : 'var(--ol-bg-callout)',
    border: sel ? '1px solid var(--ol-accent-border)' : '1px solid var(--ol-border)',
    color: 'var(--ol-text)',
  }),
  rideBtn:  (sel) => ({
    flex: 1, padding: '9px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer',
    background: sel ? 'var(--ol-chip-selected-bg)' : 'var(--ol-chip-bg)',
    color: sel ? 'var(--ol-chip-selected-text)' : 'var(--ol-text-muted)',
    border: sel ? '1px solid var(--ol-chip-selected-border)' : '1px solid var(--ol-chip-border)',
    textAlign: 'center',
  }),
  submitBtn: (enabled) => ({
    display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)',
    fontSize: 15, fontWeight: 700, cursor: enabled ? 'pointer' : 'default',
    background: enabled ? 'var(--ol-btn-bg)' : 'var(--ol-btn-disabled)',
    color: 'var(--ol-btn-text)', border: 'none', marginTop: 4,
  }),
  primaryBtn: {
    display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)',
    fontSize: 15, fontWeight: 700, color: 'var(--ol-btn-text)', background: 'var(--ol-btn-bg)',
    textAlign: 'center', textDecoration: 'none', marginBottom: 8, boxSizing: 'border-box',
  },
  secondaryBtn: {
    display: 'block', width: '100%', padding: '10px 0', borderRadius: 'var(--ol-radius-md)',
    fontSize: 13, fontWeight: 600, color: 'var(--ol-accent)', background: 'var(--ol-accent-light)',
    border: '1px solid var(--ol-accent-border)', textAlign: 'center', textDecoration: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--ol-radius-md)', fontSize: 13,
    background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)',
    color: 'var(--ol-text)', outline: 'none',
  },
};

export default function EmbedRepairOrReplace() {
  const [brand, setBrand]               = useState('');
  const [frameMaterial, setFrameMaterial] = useState('');
  const [age, setAge]                   = useState('');
  const [suspType, setSuspType]         = useState('');
  const [issues, setIssues]             = useState([]);
  const [riding, setRiding]             = useState('');
const [result, setResult]             = useState(null);
  const [newBikeBudget, setNewBikeBudget] = useState('');
  const resultRef = useRef(null);

  const canSubmit = brand && age && issues.length > 0 && riding;

  const toggleIssue = (id) =>
    setIssues(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSubmit = () => {
    const r = diagnose({ brand, age, issues, riding, frameMaterial, suspType });
    setResult(r);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const reset = () => {
    setResult(null);
    setNewBikeBudget('');
    setBrand(''); setFrameMaterial(''); setAge(''); setSuspType('');
    setIssues([]); setRiding('');
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
            {BRANDS_FLAT.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Frame material */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>
            Frame material{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>— if you know it</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {FRAME_MATERIALS.map(m => (
              <button key={m.id} onClick={() => setFrameMaterial(frameMaterial === m.id ? '' : m.id)} style={S.gridBtn(frameMaterial === m.id)}>
                {m.label}
              </button>
            ))}
          </div>
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

        {/* Suspension type */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>
            Suspension type{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>— helps a lot</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {SUSP_TYPES.map(t => (
              <button key={t.id} onClick={() => setSuspType(suspType === t.id ? '' : t.id)} style={S.gridBtn(suspType === t.id)}>
                {t.label}
              </button>
            ))}
          </div>
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

          {/* Conversational sections */}
          {result.sections && result.sections.length > 0 && (
            <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px', marginBottom: 12 }}>
              {result.sections.map((sec, i) => (
                <div key={i} style={{ marginBottom: i < result.sections.length - 1 ? 14 : 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-accent)', marginBottom: 4, marginTop: 0 }}>
                    {sec.title}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Issue cost table — only when no sections */}
          {(!result.sections || result.sections.length === 0) && result.repairNotes.length > 0 && (
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

          {/* Replace next-step section */}
          {result.ctaVerdict === 'new_bike' && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Budget selector */}
              <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-text-hint)', marginBottom: 10, marginTop: 0 }}>
                  What's your budget for a new bike?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {NEW_BIKE_BUDGETS.map(b => (
                    <button key={b} onClick={() => setNewBikeBudget(b === newBikeBudget ? '' : b)}
                      style={S.gridBtn(newBikeBudget === b)}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Under $500 — BiCi Co. */}
              {newBikeBudget === 'Under $500' && (
                <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-accent)', marginBottom: 6, marginTop: 0 }}>
                    BiCi Co. — Hartford's community bike shop
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 10, marginTop: 0 }}>
                    They sell quality upcycled bikes at affordable prices and every purchase supports their community programs.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {['Hartford — 97 Park St', 'West Hartford — 616 New Park Ave'].map(loc => (
                      <div key={loc} style={{ padding: '8px 10px', borderRadius: 'var(--ol-radius-md)', background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)', fontSize: 12, color: 'var(--ol-text-muted)' }}>
                        {loc}
                      </div>
                    ))}
                  </div>
                  <a href="https://bicico.org" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', padding: '11px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--ol-accent)', background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box', marginBottom: 10 }}>
                    bicico.org →
                  </a>
                  <p style={{ fontSize: 12, color: 'var(--ol-text-hint)', lineHeight: 1.5, margin: 0 }}>
                    We can also help you figure out if a used bike you're looking at is worth buying — just reach out.
                  </p>
                </div>
              )}

              {/* $500–$1,500 — BiCi Co. + local shops */}
              {newBikeBudget === '$500–$1,500' && (
                <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 10, marginTop: 0 }}>
                    BiCi Co. has some great finds in this range, or check out these local shops for new bikes:
                  </p>
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--ol-radius-md)', background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)', marginBottom: 2, marginTop: 0 }}>BiCi Co.</p>
                    <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', marginBottom: 6, marginTop: 0 }}>Hartford · West Hartford</p>
                    <a href="https://bicico.org" target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--ol-accent)', textDecoration: 'none' }}>
                      bicico.org →
                    </a>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-text-hint)', marginBottom: 8, marginTop: 0 }}>
                    Local shops
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {LOCAL_SHOPS.map(shop => (
                      <div key={shop.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--ol-radius-md)', background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)' }}>{shop.name}</span>
                        {shop.town && <span style={{ fontSize: 11, color: 'var(--ol-text-hint)' }}>{shop.town}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* $1,500–$3,000 — local shops */}
              {newBikeBudget === '$1,500–$3,000' && (
                <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 10, marginTop: 0 }}>
                    These shops can set you up with something solid in this range.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {LOCAL_SHOPS.map(shop => (
                      <div key={shop.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--ol-radius-md)', background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)' }}>{shop.name}</span>
                        {shop.town && <span style={{ fontSize: 11, color: 'var(--ol-text-hint)' }}>{shop.town}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* $3,000–$5,000 — local shops + soft custom mention */}
              {newBikeBudget === '$3,000–$5,000' && (
                <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 10, marginTop: 0 }}>
                    Your local shop has great options here. If you want something more tailored, we do custom builds too.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {LOCAL_SHOPS.map(shop => (
                      <div key={shop.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--ol-radius-md)', background: 'var(--ol-bg-input)', border: '1px solid var(--ol-border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)' }}>{shop.name}</span>
                        {shop.town && <span style={{ fontSize: 11, color: 'var(--ol-text-hint)' }}>{shop.town}</span>}
                      </div>
                    ))}
                  </div>
                  <a href="https://oneloveoutdoors.org/schedule-service-app" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', padding: '11px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--ol-accent)', background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                    Learn about custom builds →
                  </a>
                </div>
              )}

              {/* $5,000+ — custom builds */}
              {newBikeBudget === '$5,000+' && (
                <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-accent)', marginBottom: 6, marginTop: 0 }}>
                    At this budget, you deserve something built for you.
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 12, marginTop: 0 }}>
                    Custom builds mean every part is chosen with intention. Independent frame builders working in small batches. Components selected for how you ride, not what came in the box.
                  </p>
                  <a href="https://oneloveoutdoors.org/schedule-service-app" target="_blank" rel="noopener noreferrer"
                    style={S.primaryBtn}>
                    Tell us about your dream bike →
                  </a>
                </div>
              )}

              {/* Always — pass along old bike */}
              <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)', padding: '10px 14px' }}>
                <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  <strong style={{ color: 'var(--ol-text)' }}>Want us to handle the old bike?</strong>{' '}
                  We can help you pass it along to someone who needs it.
                </p>
              </div>

            </div>
          )}

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
