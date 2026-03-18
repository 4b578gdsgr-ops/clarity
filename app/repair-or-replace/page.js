'use client';

import { useState, useRef } from 'react';
import { diagnose } from '../../lib/bikeRepairEngine';

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// ─── CTA config per verdict ───────────────────────────────────────────────────

const CTA = {
  fix: {
    primary:   { label: 'Find a local shop →', href: '/find-a-shop' },
    secondary: { label: 'Learn about membership', href: '/membership' },
    note: 'Members get priority service and discounted labor.',
  },
  upgrade: {
    primary:   { label: 'Find a local shop →', href: '/find-a-shop' },
    secondary: { label: 'Or talk to us about component work', href: '/custom-builds' },
    note: 'A good local mechanic can handle most of this. We do custom builds and hand-built wheels if you need to go further.',
  },
  local_shop: {
    primary:   { label: 'Find a shop near you →', href: '/find-a-shop' },
    secondary: null,
    note: 'Ask for a frame inspection — most shops do this for free.',
  },
  new_bike: {
    primary:   { label: 'Find your next bike →', href: '/' },
    secondary: { label: 'See custom builds', href: '/custom-builds' },
    note: 'The bike finder wizard takes 2 minutes and steers you toward local shops.',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RepairOrReplacePage() {
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
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#2d3436', fontFamily: 'Playfair Display, serif' }}>
            Repair or Replace?
          </h1>
          <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: '#636e72' }}>
            Be honest — how long has that bike been sitting there? Let's figure out what it needs. And what you deserve.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 24px rgba(45,134,83,0.07)' }}>

          {/* Brand */}
          <div className="mb-5">
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              What brand is it?
            </label>
            <select
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: brand ? '#2d3436' : '#9ca3af' }}>
              <option value="">Select brand...</option>
              {BRAND_GROUPS.map(g => (
                <optgroup key={g.label} label={g.label}>
                  {g.brands.map(b => <option key={b} value={b}>{b}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Age */}
          <div className="mb-5">
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              How old is it?
            </label>
            <div className="flex flex-col gap-2">
              {AGES.map(a => (
                <button key={a.id} onClick={() => setAge(a.id)}
                  className="text-left px-4 py-2.5 rounded-lg text-sm transition-all"
                  style={{
                    background: age === a.id ? '#f0faf5' : '#faf9f6',
                    border: age === a.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                    color: '#2d3436',
                  }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="mb-5">
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              What's wrong? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Check everything that applies.</span>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ISSUES.map(issue => (
                <button key={issue.id} onClick={() => toggleIssue(issue.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all"
                  style={{
                    background: issues.includes(issue.id) ? '#f0faf5' : '#faf9f6',
                    border: issues.includes(issue.id) ? '1px solid #2d8653' : '1px solid #e5e0d8',
                    color: '#2d3436',
                  }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: issues.includes(issue.id) ? '#2d8653' : '#ffffff',
                    border: issues.includes(issue.id) ? '1px solid #2d8653' : '1px solid #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {issues.includes(issue.id) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {issue.label}
                </button>
              ))}
            </div>
          </div>

          {/* Riding frequency */}
          <div className="mb-6">
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              How much do you ride?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RIDING.map(r => (
                <button key={r.id} onClick={() => setRiding(r.id)}
                  className="py-2.5 rounded-lg text-sm transition-all"
                  style={{
                    background: riding === r.id ? '#2d8653' : '#faf9f6',
                    color: riding === r.id ? '#ffffff' : '#636e72',
                    border: riding === r.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: canSubmit ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#d1ead9',
              cursor: canSubmit ? 'pointer' : 'default',
            }}>
            Tell me what to do →
          </button>
        </div>

        {/* Result */}
        {result && (
          <div ref={resultRef} className="mb-8">

            {/* Verdict banner */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: result.accentBg, border: `1px solid ${result.color}30` }}>
              <div className="flex items-start gap-3">
                <div className="text-3xl shrink-0 mt-0.5">{result.icon}</div>
                <div>
                  <div className="text-lg font-bold leading-snug mb-1" style={{ color: result.color, fontFamily: 'Playfair Display, serif' }}>
                    {result.headline}
                  </div>
                  <div className="text-sm font-medium mb-3" style={{ color: '#2d3436' }}>
                    {result.subheadline}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#636e72' }}>
                    {result.body}
                  </p>
                  {result.estimatedCost && (
                    <div className="mt-3 text-xs font-medium" style={{ color: result.color }}>
                      {result.estimatedCost}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Issue-by-issue notes */}
            {result.repairNotes.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
                  What each issue actually costs
                </div>
                <div className="flex flex-col gap-2.5">
                  {result.repairNotes.map((note, i) => (
                    <div key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: '#636e72' }}>
                      <span style={{ color: '#2d8653', flexShrink: 0, marginTop: 1 }}>♥</span>
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
              <div className="flex flex-col gap-2">
                <a href={cta.primary.href}
                  className="block text-center py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2d8653, #1a6e3f)' }}>
                  {cta.primary.label}
                </a>
                {cta.secondary && (
                  <a href={cta.secondary.href}
                    className="block text-center py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: '#f6fbf8', color: '#2d8653', border: '1px solid #d1ead9' }}>
                    {cta.secondary.label}
                  </a>
                )}
              </div>
              {cta.note && (
                <p className="text-center text-xs mt-3" style={{ color: '#9ca3af' }}>{cta.note}</p>
              )}
            </div>

            {/* Start over */}
            <div className="mt-6 text-center">
              <button onClick={reset} className="text-xs" style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Start over
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
