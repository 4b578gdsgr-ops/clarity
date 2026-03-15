'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import BikeWizard from './components/BikeWizard';
import RecommendationResult from './components/RecommendationResult';
import ShopCard from './components/ShopCard';
import CryptoDonate from './components/CryptoDonate';
import { recommend } from '../lib/recommendationEngine';

const ShopMap = dynamic(() => import('./components/ShopMap'), { ssr: false });

const QUOTES = [
  { text: "Love's real, not fade away", attribution: "Grateful Dead, Not Fade Away" },
  { text: "Without love in the dream it'll never come true", attribution: "Grateful Dead, Help on the Way" },
  { text: "Put your gold money where your love is, baby, before you let my deal go down", attribution: "Grateful Dead, Deal" },
  { text: "Reach out your hand, if your cup be empty. If your cup is full, may it be again", attribution: "Grateful Dead, Ripple" },
  { text: "Heartless powers try to tell us what to think, if the spirit's sleeping then the flesh is ink", attribution: "Grateful Dead, Throwing Stones" },
  { text: "Don't give it up, you got an empty cup, only love can fill", attribution: "Grateful Dead, Comes a Time" },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(null);
  const [quoteVisible, setQuoteVisible] = useState(false);

  // Wizard + results state
  const [wizardDone, setWizardDone] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [shops, setShops] = useState([]);
  const [shopCenter, setShopCenter] = useState(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  const resultsRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const start = Math.floor(Math.random() * QUOTES.length);
    setQuoteIndex(start);
    setTimeout(() => setQuoteVisible(true), 50);
    const cycle = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => { setQuoteIndex(i => (i + 1) % QUOTES.length); setQuoteVisible(true); }, 800);
    }, 10000);
    return () => clearInterval(cycle);
  }, []);

  const handleWizardComplete = async (wizardProfile) => {
    setProfile(wizardProfile);
    const rec = recommend(wizardProfile);
    setRecommendation(rec);
    setWizardDone(true);

    // Scroll to results
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    // Fetch nearby shops
    if (wizardProfile.zip?.length === 5) {
      setShopsLoading(true);
      try {
        const res = await fetch(`/api/shops?zip=${wizardProfile.zip}&radius=${wizardProfile.radius || 25}`);
        const data = await res.json();
        setShops(data.shops || []);
        setShopCenter(data.center || null);
      } catch { setShops([]); }
      setShopsLoading(false);
    }
  };

  const resetWizard = () => {
    setWizardDone(false);
    setProfile(null);
    setRecommendation(null);
    setShops([]);
    setShopCenter(null);
    setSelectedShop(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <h1 className="flex items-baseline justify-center select-none mb-3" style={{ lineHeight: 1, gap: '0.2em' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '2.25rem', letterSpacing: '-0.01em' }}>Love</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d8653', fontSize: '3.4rem', lineHeight: 0.85 }}>&gt;</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '2.25rem', letterSpacing: '-0.01em' }}>Money</span>
          </h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Your dollar is your last vote.</p>
          <p className="text-[11px] mt-1" style={{ color: '#b0b8b4' }}>A One Love Outdoors 501(c)(3) project</p>
        </div>

        {/* Wizard */}
        {!wizardDone && (
          <>
            <div className={`text-center mb-4 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: '#636e72' }}>
                Bikes aren't just products. They're the shop that knew your name. The trail after a hard week. We built this to keep that alive.
              </p>
            </div>
            <div className={`p-5 rounded-2xl mb-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 24px rgba(45,134,83,0.07)' }}>
              <p className="text-xs text-center mb-4" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                {`Let's find your bike the right way — by talking about what you actually ride.`}
              </p>
              <BikeWizard onComplete={handleWizardComplete} />
            </div>

            {/* Three paths */}
            <div className={`mb-8 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#9ca3af' }}>
                What we do
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-4 px-4 py-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                  <div className="text-2xl shrink-0">🚵</div>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: '#2d3436' }}>Find your bike + a local shop</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                      Answer a few questions. We'll match you with the right ride and a local shop that carries it.
                    </div>
                  </div>
                </div>
                <a href="/custom-builds" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
                  style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2d8653'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#d1ead9'}>
                  <div className="text-2xl shrink-0">🛠️</div>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: '#2d8653' }}>Custom builds →</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                      American-made frames. Fitted to your body. Components chosen for quality, not a catalog. Budget $5k and up.
                    </div>
                  </div>
                </a>
                <a href="/membership" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
                  style={{ background: '#faf9ff', border: '1px solid #e0d9f7' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#9333ea'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d9f7'}>
                  <div className="text-2xl shrink-0">♥</div>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: '#9333ea' }}>Membership →</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                      Free pickup and dropoff. Priority service. Seasonal tune-up. Direct line to Nate. $25/month.
                    </div>
                  </div>
                </a>
                <a href="/fix-or-ride" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#fde68a'}>
                  <div className="text-2xl shrink-0">🔧</div>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: '#d97706' }}>Fix or Ride? →</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                      Got a bike collecting dust? Tell us what's wrong. We'll tell you if it's worth fixing.
                    </div>
                  </div>
                </a>
                <a href="/schedule-service" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0ea5e9'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#bae6fd'}>
                  <div className="text-2xl shrink-0">🚐</div>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: '#0ea5e9' }}>Schedule Service →</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                      We pick it up, fix it, bring it back.
                    </div>
                  </div>
                </a>
              </div>
              <p className="text-center text-[11px] mt-4 max-w-xs mx-auto" style={{ color: '#9ca3af' }}>
                The finder is free. Custom builds and memberships fund trail work and community rides.
              </p>
            </div>
          </>
        )}

        {/* Results */}
        {wizardDone && (
          <div ref={resultsRef}>
            <RecommendationResult result={recommendation} profile={profile} />

            {/* Shop finder */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                  Local shops near {profile?.zip}
                </div>
                {shops.length > 0 && (
                  <div className="text-xs" style={{ color: '#9ca3af' }}>{shops.length} found</div>
                )}
              </div>

              {shopsLoading && (
                <div className="text-center py-8">
                  <div className="w-7 h-7 rounded-full animate-spin mx-auto" style={{ border: '2px solid #e5e0d8', borderTopColor: '#2d8653' }} />
                  <div className="mt-2 text-xs" style={{ color: '#9ca3af' }}>Finding shops near you...</div>
                </div>
              )}

              {!shopsLoading && shops.length > 0 && (
                <>
                  <div className="mb-4">
                    <ShopMap
                      shops={shops}
                      center={shopCenter}
                      onSelectShop={setSelectedShop}
                      selectedShop={selectedShop}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    {shops.map(shop => (
                      <ShopCard key={shop.id} shop={shop}
                        selected={selectedShop?.id === shop.id}
                        onSelect={setSelectedShop} />
                    ))}
                  </div>
                </>
              )}

              {!shopsLoading && shops.length === 0 && profile?.zip && (
                <div className="text-center py-6">
                  <p className="text-sm" style={{ color: '#636e72' }}>No shops found near {profile.zip}.</p>
                  <a href="/find-a-shop" className="text-xs mt-1 block" style={{ color: '#2d8653' }}>
                    Try the full shop finder →
                  </a>
                </div>
              )}
            </div>

            {/* Start over */}
            <div className="mt-8 text-center">
              <button onClick={resetWizard}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#ffffff', border: '1px solid #d1ead9', color: '#4a9e6b' }}>
                ← Start over
              </button>
            </div>
          </div>
        )}

        {/* Donation */}
        <div className="mt-10 mb-6 text-center">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#b0b8b4' }}>Support the work</div>
          <p className="text-xs mb-4 max-w-xs mx-auto leading-relaxed" style={{ color: '#9ca3af' }}>
            Free, ad-free, nonprofit. Help us keep it that way.
          </p>
          <a href="https://www.paypal.com/donate/?hosted_button_id=M5YTUPJJDF434" target="_blank" rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-bold text-white mb-6"
            style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}>
            Donate USD
          </a>
        </div>

        <CryptoDonate />

        <div className="text-center pt-8 pb-4">
          <p className="mb-1 max-w-sm mx-auto" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#636e72', fontSize: '0.82rem', lineHeight: 1.6 }}>
            "No ads. No investors. No private equity. Just this."
          </p>
          <p className="mb-4 max-w-sm mx-auto" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#9aad9c', fontSize: '0.78rem', lineHeight: 1.6 }}>
            Love over money. Always.
          </p>
          <div className="text-[10px]" style={{ color: '#c4bdb5' }}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
          <div className="flex justify-center gap-4 mt-1">
            <a href="/about" className="text-[10px] hover:underline" style={{ color: '#b0b8b4' }}>Why this exists</a>
            <a href="/methodology" className="text-[10px] hover:underline" style={{ color: '#b0b8b4' }}>How we score</a>
          </div>
        </div>

        {quoteIndex !== null && (
          <div style={{ position: 'fixed', bottom: '12px', right: '14px', opacity: quoteVisible ? 0.55 : 0, transition: 'opacity 0.8s ease', maxWidth: '220px', textAlign: 'right', pointerEvents: 'none' }}>
            <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#7aad8c', fontSize: '11px', lineHeight: 1.5 }}>
              {QUOTES[quoteIndex].text}
            </p>
            <p style={{ color: '#a8c4b0', fontSize: '9px', marginTop: '3px' }}>
              — {QUOTES[quoteIndex].attribution}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
