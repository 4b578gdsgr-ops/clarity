'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BikeWizard from './components/BikeWizard';
import RecommendationResult from './components/RecommendationResult';
import ShopCard from './components/ShopCard';
import CryptoDonate from './components/CryptoDonate';
import { recommend } from '../lib/recommendationEngine';

const ShopMap = dynamic(() => import('./components/ShopMap'), { ssr: false });
const ServiceMap = dynamic(() => import('./components/ServiceMap'), { ssr: false });

const QUOTES = [
  { text: "Love's real, not fade away", attribution: "Grateful Dead, Not Fade Away" },
  { text: "Without love in the dream it'll never come true", attribution: "Grateful Dead, Help on the Way" },
  { text: "Put your gold money where your love is, baby, before you let my deal go down", attribution: "Grateful Dead, Deal" },
  { text: "Reach out your hand, if your cup be empty. If your cup is full, may it be again", attribution: "Grateful Dead, Ripple" },
  { text: "Heartless powers try to tell us what to think, if the spirit's sleeping then the flesh is ink", attribution: "Grateful Dead, Throwing Stones" },
  { text: "Don't give it up, you got an empty cup, only love can fill", attribution: "Grateful Dead, Comes a Time" },
];

const ISSUE_OPTIONS = ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'Other'];

// ─── Inline service booking ───────────────────────────────────────────────────

function InlineBooking() {
  const [form, setForm] = useState({ name: '', phone: '', issues: [], preferred_day: '', time_slot: '' });
  const [showMap, setShowMap] = useState(false);
  const [pin, setPin] = useState(null);
  const [pinAddr, setPinAddr] = useState('');
  const [addrQuery, setAddrQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setFieldErr(e => ({ ...e, [k]: '' })); }

  function toggleIssue(issue) {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(issue) ? f.issues.filter(i => i !== issue) : [...f.issues, issue],
    }));
  }

  async function searchAddr(e) {
    e.preventDefault();
    if (!addrQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' + encodeURIComponent(addrQuery),
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
      );
      const results = await res.json();
      if (results[0]) {
        setPin({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
        setPinAddr(results[0].display_name.split(',').slice(0, 2).join(','));
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (Object.keys(errs).length) { setFieldErr(errs); return; }
    setSubmitting(true);
    setErr('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: pin ? pin.lat : null,
          lng: pin ? pin.lng : null,
          address: pinAddr || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Something went wrong.'); return; }
      setBookingId(data.booking.id);
    } catch { setErr('Network error. Try again.'); }
    setSubmitting(false);
  }

  const inp = {
    width: '100%', padding: '10px 13px', border: '1px solid #e5e0d8',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fff',
  };
  const label = { display: 'block', fontSize: 13, color: '#636e72', marginBottom: 3, fontWeight: 500 };

  if (bookingId) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#2d3436', marginBottom: 8 }}>Got it.</div>
        <p style={{ color: '#636e72', marginBottom: 20 }}>{'We\'ll reach out to confirm a time.'}</p>
        <a
          href={'/service/' + bookingId}
          style={{
            display: 'inline-block', padding: '11px 28px',
            background: '#2d8653', color: '#fff', borderRadius: 10,
            textDecoration: 'none', fontSize: 15, fontWeight: 600,
          }}
        >
          Track your booking
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {err && (
        <p style={{ color: '#dc2626', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 7, marginBottom: 12 }}>
          {err}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={label}>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="Your name"
            style={{ ...inp, borderColor: fieldErr.name ? '#dc2626' : '#e5e0d8' }}
          />
          {fieldErr.name && <span style={{ fontSize: 12, color: '#dc2626' }}>{fieldErr.name}</span>}
        </div>
        <div>
          <label style={label}>Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="(xxx) xxx-xxxx"
            style={{ ...inp, borderColor: fieldErr.phone ? '#dc2626' : '#e5e0d8' }}
          />
          {fieldErr.phone && <span style={{ fontSize: 12, color: '#dc2626' }}>{fieldErr.phone}</span>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={label}>What needs work?</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ISSUE_OPTIONS.map(issue => {
            const on = form.issues.includes(issue);
            return (
              <button
                key={issue}
                type="button"
                onClick={() => toggleIssue(issue)}
                style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 13, cursor: 'pointer',
                  border: on ? '2px solid #2d8653' : '1px solid #e5e0d8',
                  background: on ? '#2d8653' : '#fff',
                  color: on ? '#fff' : '#4a4a4a',
                }}
              >
                {issue}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={label}>Preferred day</label>
          <select
            value={form.preferred_day}
            onChange={e => setField('preferred_day', e.target.value)}
            style={{ ...inp, color: form.preferred_day ? '#2d3436' : '#9ca3af' }}
          >
            <option value="">No preference</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Thursday">Thursday</option>
          </select>
        </div>
        <div>
          <label style={label}>Preferred time</label>
          <select
            value={form.time_slot}
            onChange={e => setField('time_slot', e.target.value)}
            style={{ ...inp, color: form.time_slot ? '#2d3436' : '#9ca3af' }}
          >
            <option value="">No preference</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          style={{
            background: 'none', border: 'none', color: '#2d8653',
            fontSize: 13, cursor: 'pointer', padding: 0,
          }}
        >
          {showMap ? 'Hide map' : '+ Pin your pickup location (optional)'}
        </button>

        {showMap && (
          <div style={{ marginTop: 10 }}>
            <form onSubmit={searchAddr} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                value={addrQuery}
                onChange={e => setAddrQuery(e.target.value)}
                placeholder="Search address..."
                style={{ ...inp, flex: 1 }}
              />
              <button
                type="submit"
                disabled={searching}
                style={{ padding: '8px 14px', background: '#2d8653', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                {searching ? '...' : 'Find'}
              </button>
            </form>
            <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e0d8' }}>
              <ServiceMap
                pin={pin}
                onMapClick={(lat, lng) => { setPin({ lat, lng }); setPinAddr(''); }}
              />
            </div>
            {pin && (
              <p style={{ fontSize: 12, color: '#636e72', marginTop: 6 }}>
                {pinAddr || 'Pin: ' + pin.lat.toFixed(5) + ', ' + pin.lng.toFixed(5)}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', padding: '13px 0',
          background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #2d8653, #1a6e3f)',
          color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600,
          cursor: submitting ? 'default' : 'pointer',
          boxShadow: '0 4px 16px rgba(45,134,83,0.2)',
        }}
      >
        {submitting ? 'Booking...' : 'Book a Pickup'}
      </button>

      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
        {'We\'ll confirm a time by text or message.'}
      </p>
    </form>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(null);
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [shops, setShops] = useState([]);
  const [shopCenter, setShopCenter] = useState(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

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
    setRecommendation(recommend(wizardProfile));
    setWizardDone(true);
    if (wizardProfile.zip?.length === 5) {
      setShopsLoading(true);
      try {
        const res = await fetch('/api/shops?zip=' + wizardProfile.zip + '&radius=' + (wizardProfile.radius || 25));
        const data = await res.json();
        setShops(data.shops || []);
        setShopCenter(data.center || null);
      } catch { setShops([]); }
      setShopsLoading(false);
    }
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

        {/* ── SERVICE HERO ── */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="p-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 24px rgba(45,134,83,0.08)' }}>
            <div className="mb-4">
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1a3328', marginBottom: 4 }}>
                We come to you.
              </h2>
              <p className="text-sm" style={{ color: '#636e72' }}>
                Pickup, fix, return. Book a service stop — we handle the rest.
              </p>
            </div>
            <InlineBooking />
          </div>
        </div>

        {/* ── SECONDARY TOOLS ── */}
        <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#9ca3af' }}>
            More from One Love
          </div>
          <div className="flex flex-col gap-3">
            <a href="/fix-or-ride" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#fde68a'}>
              <div className="shrink-0" style={{ fontSize: 22 }}>?</div>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#d97706' }}>Fix or Ride?</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Got a bike collecting dust? Tell us what is wrong. We will tell you if it is worth fixing.
                </div>
              </div>
            </a>

            <a href="/custom-builds" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2d8653'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d1ead9'}>
              <div className="shrink-0" style={{ fontSize: 22 }}>+</div>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#2d8653' }}>Custom Builds</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Independent builders. Fitted to your body. Components chosen for quality, not a catalog. Budget $5k and up.
                </div>
              </div>
            </a>

            <a href="/membership" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#faf9ff', border: '1px solid #e0d9f7' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#9333ea'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d9f7'}>
              <div className="shrink-0" style={{ fontSize: 22 }}>+</div>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#9333ea' }}>Membership</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Free pickup and dropoff. Priority service. Seasonal tune-up. $25/month.
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ── BIKE FINDER ── */}
        <div className={`mb-8 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#9ca3af' }}>
            Find your next bike
          </div>
          {!wizardDone && (
            <div className="p-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 16px rgba(45,134,83,0.05)' }}>
              <p className="text-xs text-center mb-4" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                {"Let's find your bike the right way."}
              </p>
              <BikeWizard onComplete={handleWizardComplete} />
            </div>
          )}

          {wizardDone && (
            <div>
              <RecommendationResult result={recommendation} profile={profile} />

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                    Local shops near {profile?.zip}
                  </div>
                  {shops.length > 0 && <div className="text-xs" style={{ color: '#9ca3af' }}>{shops.length} found</div>}
                </div>

                {shopsLoading && (
                  <div className="text-center py-8">
                    <div className="w-7 h-7 rounded-full animate-spin mx-auto" style={{ border: '2px solid #e5e0d8', borderTopColor: '#2d8653' }} />
                    <div className="mt-2 text-xs" style={{ color: '#9ca3af' }}>Finding shops near you...</div>
                  </div>
                )}

                {!shopsLoading && shops.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <ShopMap shops={shops} center={shopCenter} onSelectShop={setSelectedShop} selectedShop={selectedShop} />
                    </div>
                    <div className="flex flex-col gap-3">
                      {shops.map(shop => (
                        <ShopCard key={shop.id} shop={shop} selected={selectedShop?.id === shop.id} onSelect={setSelectedShop} />
                      ))}
                    </div>
                  </div>
                )}

                {!shopsLoading && shops.length === 0 && profile?.zip && (
                  <div className="text-center py-6">
                    <p className="text-sm" style={{ color: '#636e72' }}>No shops found near {profile.zip}.</p>
                    <a href="/find-a-shop" className="text-xs mt-1 block" style={{ color: '#2d8653' }}>Try the full shop finder</a>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setWizardDone(false); setProfile(null); setRecommendation(null); setShops([]); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#ffffff', border: '1px solid #d1ead9', color: '#4a9e6b' }}
                >
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
              {'— ' + QUOTES[quoteIndex].attribution}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
