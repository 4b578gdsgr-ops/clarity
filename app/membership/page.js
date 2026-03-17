'use client';

import { useEffect, useState } from 'react';

const SQUARE_MEMBERSHIP_URL = '#'; // TODO: paste Square subscription URL here

const PERKS = [
  `Direct line to a real mechanic who actually rides`,
  `Free pickup and dropoff — we come to you`,
  `Priority service — your bike doesn't wait in a queue`,
  `Seasonal tune-up included — we'll remind you`,
  `Parts sourced at near-cost — we're not marking up to make margin`,
  `Full suspension service in-house — fork rebuilds, re-valving, and setup for your weight and riding style`,
  `You're funding trail work, community rides, and keeping this tool free for everyone`,
];

export default function MembershipPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
            No ads. No investors. Just riders who think this matters.
          </p>
          <p className="text-xs mt-3 max-w-sm mx-auto" style={{ color: '#9ca3af' }}>
            One standalone pickup costs $25. The membership is $25/month — free pickups, priority service, seasonal tune-up. Most people join because they want this to exist.
          </p>
        </div>

        {/* Membership card */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="p-5 rounded-2xl" style={{ background: '#f0faf5', border: '2px solid #2d8653', boxShadow: '0 4px 20px #2d865320' }}>
            <div className="mb-4">
              <div className="text-base font-bold" style={{ color: '#2d8653', fontFamily: 'Playfair Display, serif' }}>
                One Love Membership
              </div>
              <div className="text-2xl font-black font-mono mt-0.5" style={{ color: '#2d3436' }}>
                $25/month
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {PERKS.map((perk, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-sm shrink-0" style={{ color: '#2d8653' }}>♥</span>
                  <span className="text-xs leading-relaxed" style={{ color: '#4a5568' }}>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Square checkout */}
        <div className={`text-center mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <a
            href={SQUARE_MEMBERSHIP_URL}
            className="inline-block w-full py-4 rounded-xl text-base font-bold text-white"
            style={{
              background: SQUARE_MEMBERSHIP_URL === '#'
                ? '#9ca3af'
                : 'linear-gradient(135deg, #2d8653, #1a6e3f)',
              cursor: SQUARE_MEMBERSHIP_URL === '#' ? 'default' : 'pointer',
              textDecoration: 'none',
              pointerEvents: SQUARE_MEMBERSHIP_URL === '#' ? 'none' : 'auto',
            }}
          >
            Join — $25/month
          </a>
          {SQUARE_MEMBERSHIP_URL === '#' && (
            <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
              Membership signup launching soon.
            </p>
          )}
          <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>
            Billed monthly through Square. Cancel anytime.
          </p>
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

      </div>
    </div>
  );
}
