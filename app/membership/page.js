'use client';

import { useState, useEffect } from 'react';

const TIERS = {
  base: {
    name: 'One Love Membership',
    price: '$25/month',
    color: '#2d8653',
    bg: '#f0faf5',
    border: '#a3d9b5',
    perks: [
      `Direct line to a real mechanic who actually rides`,
      `Free pickup and dropoff — we come to you`,
      `Priority service — your bike doesn't wait in a queue`,
      `Seasonal tune-up included — we'll remind you`,
      `Parts sourced at near-cost — we're not marking up to make margin`,
      `Full suspension service in-house — fork rebuilds, re-valving, and setup for your weight and riding style`,
      `You're funding trail work, community rides, and keeping this tool free for everyone`,
    ],
  },
  premium: {
    name: 'One Love Premium',
    price: '$99/month',
    color: '#9333ea',
    bg: '#faf9ff',
    border: '#c4b5fd',
    perks: [
      'Everything in One Love Service Membership',
      'One free wheel true per month',
      'Annual full overhaul included',
      'Custom build consultation included',
      'Loaner bike during extended service',
      'Priority access to new custom build slots',
    ],
  },
};

function MembershipCard({ tier, id, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(id)}
      className="p-5 rounded-2xl cursor-pointer transition-all"
      style={{
        background: tier.bg,
        border: selected ? `2px solid ${tier.color}` : `1px solid ${tier.border}`,
        boxShadow: selected ? `0 4px 20px ${tier.color}20` : 'none',
      }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-bold" style={{ color: tier.color, fontFamily: 'Playfair Display, serif' }}>
            {tier.name}
          </div>
          <div className="text-2xl font-black font-mono mt-0.5" style={{ color: '#2d3436' }}>
            {tier.price}
          </div>
        </div>
        <div className="mt-1">
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: tier.color, background: selected ? tier.color : 'transparent' }}>
            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {tier.perks.map((perk, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-sm shrink-0" style={{ color: tier.color }}>♥</span>
            <span className="text-xs leading-relaxed" style={{ color: '#4a5568' }}>{perk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState('base');
  const [form, setForm] = useState({ name: '', email: '', bikes_owned: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/membership-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tier: selectedTier }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-10 max-w-2xl mx-auto">

        {/* Hero */}
        <div className={`text-center mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <div className="text-xs font-bold tracking-[3px] uppercase mb-3" style={{ color: '#2d8653' }}>
            One Love Membership
          </div>
          <h1 className="text-3xl font-black mb-3 leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: '#2d3436' }}>
            This is how we keep the lights on without selling out.
          </h1>
          <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: '#636e72' }}>
            No ads. No investors. No private equity. Just riders who think this is worth supporting.
          </p>
          <p className="text-xs mt-3 max-w-sm mx-auto" style={{ color: '#9ca3af' }}>
            One pickup without a membership costs $25. The membership is $25/month with free pickups, priority service, and a seasonal tune-up. The math is simple. But honestly, most people join because they want this thing to exist.
          </p>
        </div>

        {/* Tier selector */}
        <div className={`flex flex-col gap-4 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1 text-center" style={{ color: '#9ca3af' }}>
            Choose your tier
          </div>
          <MembershipCard tier={TIERS.base} id="base" selected={selectedTier === 'base'} onSelect={setSelectedTier} />
          <MembershipCard tier={TIERS.premium} id="premium" selected={selectedTier === 'premium'} onSelect={setSelectedTier} />
        </div>

        {/* Signup form */}
        <div className={`px-5 py-6 rounded-2xl mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 24px rgba(45,134,83,0.07)' }}>

          {sent ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">♥</div>
              <div className="text-lg font-bold mb-2" style={{ color: '#2d3436', fontFamily: 'Playfair Display, serif' }}>
                You're on the list.
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#636e72' }}>
                We'll reach out within a day or two to get you set up. Welcome to One Love.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="text-xs font-bold tracking-[2px] uppercase mb-1" style={{ color: '#9ca3af' }}>
                  Selected
                </div>
                <div className="text-base font-bold" style={{ color: '#2d3436' }}>
                  {TIERS[selectedTier].name} — {TIERS[selectedTier].price}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Email *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>What bikes do you own?</label>
                  <textarea value={form.bikes_owned} onChange={e => set('bikes_owned', e.target.value)}
                    placeholder="2021 Trek Slash, 2019 Specialized Allez... anything helps us get ready for your first visit."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none leading-relaxed"
                    style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                </div>

                {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}

                <button onClick={handleSubmit} disabled={loading || !form.name || !form.email}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{
                    background: (form.name && form.email) ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#d1ead9',
                    cursor: (form.name && form.email) ? 'pointer' : 'default',
                  }}>
                  {loading ? 'Sending...' : 'Sign me up →'}
                </button>

                <p className="text-center text-xs" style={{ color: '#9ca3af' }}>
                  No payment collected yet. We'll reach out to get you set up.
                </p>
              </div>
            </>
          )}
        </div>

        {/* FAQ / reassurance */}
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: '#9ca3af' }}>Common questions</div>
          {[
            { q: 'Where is One Love based?', a: "Connecticut. We work with riders across New England, and remotely for custom builds." },
            { q: "What if I'm not local?", a: "Custom builds ship. Service memberships are for CT riders. If you're too far for service, reach out — we'll figure something out." },
            { q: 'When does billing start?', a: "We're in early access. No charges until we confirm your membership personally. This form just holds your spot." },
            { q: "What if I don't like it?", a: 'Cancel anytime. No contracts. We believe in earning your loyalty, not locking you in.' },
          ].map(item => (
            <div key={item.q} className="mb-3 px-4 py-3 rounded-xl"
              style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
              <div className="text-sm font-bold mb-1" style={{ color: '#2d3436' }}>{item.q}</div>
              <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>{item.a}</div>
            </div>
          ))}
        </div>

        <div className="text-center pb-6">
          <div className="text-[10px]" style={{ color: '#c4bdb5' }}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
        </div>
      </div>
    </div>
  );
}
