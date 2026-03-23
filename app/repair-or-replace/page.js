'use client';

import { useState, useRef } from 'react';
import { diagnose, BRAND_TIER, BRANDS_FLAT, AGES, ISSUES, RIDING, FRAME_MATERIALS, SUSP_TYPES } from '../../lib/bikeRepairEngine';
import { LOCAL_SHOPS } from '../../lib/localShops';

const NEW_BIKE_BUDGETS = ['Under $500', '$500–$1,500', '$1,500–$3,000', '$3,000–$5,000', '$5,000+'];

// ─── CTA config per verdict ───────────────────────────────────────────────────

const CTA = {
  fix: {
    primary:   { label: 'Find a local shop →', href: '/find-a-shop' },
    secondary: { label: 'Learn about membership', href: 'https://oneloveoutdoors.org/onelove-members-only' },
    note: 'Members get priority service and discounted labor.',
  },
  upgrade: {
    primary:   { label: 'Find a local shop →', href: '/find-a-shop' },
    secondary: { label: 'Talk to us about component work', href: '/custom-builds' },
    note: 'A good local mechanic can handle most of this. We do custom builds and hand-built wheels if you want to go further.',
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

  const selBtn = (active) => ({
    background: active ? '#f0faf5' : '#faf9f6',
    border: active ? '1px solid #2d8653' : '1px solid #e5e0d8',
    color: '#2d3436',
  });

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
              {BRANDS_FLAT.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Frame material */}
          <div className="mb-5">
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              Frame material <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— if you know it</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FRAME_MATERIALS.map(m => (
                <button key={m.id} onClick={() => setFrameMaterial(frameMaterial === m.id ? '' : m.id)}
                  className="px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={selBtn(frameMaterial === m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
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
                  style={selBtn(age === a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suspension type */}
          <div className="mb-5">
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              What kind of bike? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— suspension type</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUSP_TYPES.map(t => (
                <button key={t.id} onClick={() => setSuspType(suspType === t.id ? '' : t.id)}
                  className="px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={selBtn(suspType === t.id)}>
                  {t.label}
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
                  <div className="text-sm font-medium mb-2" style={{ color: '#2d3436' }}>
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

            {/* Conversational sections */}
            {result.sections && result.sections.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                <div className="flex flex-col gap-4">
                  {result.sections.map((sec, i) => (
                    <div key={i}>
                      <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#2d8653' }}>
                        {sec.title}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issue cost table — only shown when there are no sections */}
            {(!result.sections || result.sections.length === 0) && result.repairNotes.length > 0 && (
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
                  <a href={cta.secondary.href} target="_blank" rel="noopener noreferrer"
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

            {/* Replace next-step section */}
            {result.ctaVerdict === 'new_bike' && (
              <div className="mt-4 flex flex-col gap-3">

                {/* Budget selector */}
                <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
                    What's your budget for a new bike?
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {NEW_BIKE_BUDGETS.map(b => (
                      <button key={b} onClick={() => setNewBikeBudget(b === newBikeBudget ? '' : b)}
                        className="py-2.5 rounded-lg text-sm transition-all"
                        style={{
                          background: newBikeBudget === b ? '#f0faf5' : '#faf9f6',
                          border: newBikeBudget === b ? '1px solid #2d8653' : '1px solid #e5e0d8',
                          color: '#2d3436',
                        }}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Under $500 — BiCi Co. */}
                {newBikeBudget === 'Under $500' && (
                  <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#2d8653' }}>
                      BiCi Co. — Hartford's community bike shop
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#4b5563' }}>
                      They sell quality upcycled bikes at affordable prices and every purchase supports their community programs.
                    </p>
                    <div className="flex flex-col gap-1.5 mb-3">
                      <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#636e72' }}>
                        Hartford — 97 Park St
                      </div>
                      <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#636e72' }}>
                        West Hartford — 616 New Park Ave
                      </div>
                    </div>
                    <a href="https://bicico.org" target="_blank" rel="noopener noreferrer"
                      className="block text-center py-2.5 rounded-xl text-sm font-medium mb-3"
                      style={{ background: '#f6fbf8', color: '#2d8653', border: '1px solid #d1ead9' }}>
                      bicico.org →
                    </a>
                    <p className="text-xs leading-relaxed" style={{ color: '#9ca3af', margin: 0 }}>
                      We can also help you figure out if a used bike you're looking at is worth buying — just reach out.
                    </p>
                  </div>
                )}

                {/* $500–$1,500 — BiCi Co. + local shops */}
                {newBikeBudget === '$500–$1,500' && (
                  <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#4b5563' }}>
                      BiCi Co. has some great finds in this range, or check out these local shops for new bikes:
                    </p>
                    <div className="rounded-lg px-3 py-2.5 mb-3" style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}>
                      <div className="text-xs font-bold mb-0.5" style={{ color: '#2d8653' }}>BiCi Co.</div>
                      <div className="text-xs mb-1.5" style={{ color: '#636e72' }}>Hartford · West Hartford</div>
                      <a href="https://bicico.org" target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium" style={{ color: '#2d8653', textDecoration: 'none' }}>
                        bicico.org →
                      </a>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>
                      Local shops
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {LOCAL_SHOPS.map(shop => (
                        <div key={shop.name} className="flex justify-between items-center px-3 py-2 rounded-lg"
                          style={{ background: '#faf9f6', border: '1px solid #e5e0d8' }}>
                          <span className="text-sm font-medium" style={{ color: '#2d3436' }}>{shop.name}</span>
                          {shop.town && <span className="text-xs" style={{ color: '#9ca3af' }}>{shop.town}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* $1,500–$3,000 — local shops */}
                {newBikeBudget === '$1,500–$3,000' && (
                  <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#4b5563' }}>
                      These shops can set you up with something solid in this range.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {LOCAL_SHOPS.map(shop => (
                        <div key={shop.name} className="flex justify-between items-center px-3 py-2 rounded-lg"
                          style={{ background: '#faf9f6', border: '1px solid #e5e0d8' }}>
                          <span className="text-sm font-medium" style={{ color: '#2d3436' }}>{shop.name}</span>
                          {shop.town && <span className="text-xs" style={{ color: '#9ca3af' }}>{shop.town}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* $3,000–$5,000 — local shops + soft custom mention */}
                {newBikeBudget === '$3,000–$5,000' && (
                  <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#4b5563' }}>
                      Your local shop has great options here. If you want something more tailored, we do custom builds too.
                    </p>
                    <div className="flex flex-col gap-1.5 mb-4">
                      {LOCAL_SHOPS.map(shop => (
                        <div key={shop.name} className="flex justify-between items-center px-3 py-2 rounded-lg"
                          style={{ background: '#faf9f6', border: '1px solid #e5e0d8' }}>
                          <span className="text-sm font-medium" style={{ color: '#2d3436' }}>{shop.name}</span>
                          {shop.town && <span className="text-xs" style={{ color: '#9ca3af' }}>{shop.town}</span>}
                        </div>
                      ))}
                    </div>
                    <a href="/custom-builds"
                      className="block text-center py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: '#f6fbf8', color: '#2d8653', border: '1px solid #d1ead9' }}>
                      Learn about custom builds →
                    </a>
                  </div>
                )}

                {/* $5,000+ — custom builds */}
                {newBikeBudget === '$5,000+' && (
                  <div className="rounded-xl p-4" style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#2d8653' }}>
                      At this budget, you deserve something built for you.
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: '#4b5563' }}>
                      Custom builds mean every part is chosen with intention. Independent frame builders working in small batches. Components selected for how you ride, not what came in the box.
                    </p>
                    <a href="/custom-builds"
                      className="block text-center py-3 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #2d8653, #1a6e3f)' }}>
                      Tell us about your dream bike →
                    </a>
                  </div>
                )}

                {/* Interesting frame offer — only for tier 3+ brands */}
                {(BRAND_TIER[brand] ?? 0) >= 3 && (
                  <div className="rounded-xl px-4 py-3" style={{ background: '#faf9f6', border: '1px solid #e5e0d8' }}>
                    <p className="text-sm leading-relaxed" style={{ color: '#636e72', margin: 0 }}>
                      <strong style={{ color: '#2d3436' }}>Got something cool collecting dust?</strong>{' '}
                      We're always on the lookout for interesting frames and builds. Reach out — if it's something special, we might take it off your hands.
                    </p>
                  </div>
                )}

              </div>
            )}

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
