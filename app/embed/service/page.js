'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ServiceMap = dynamic(() => import('../../components/ServiceMap'), { ssr: false });

const ISSUE_OPTIONS = ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'Other'];

const BIKE_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Yeti',
  'Pivot', 'Ibis', 'Marin', 'Kona', 'Canyon', 'Scott', 'GT',
  'Surly', 'Salsa', 'Co-op Cycles', 'Other',
];

const BASE = 'https://clarity-pi-ten.vercel.app';

// ─── Booking form ─────────────────────────────────────────────────────────────

function BookingForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', contact_preference: '',
    bike_brand: '', issues: [], preferred_day: '', time_slot: '', notes: '',
  });
  const [pin, setPin] = useState(null);
  const [pinAddr, setPinAddr] = useState('');
  const [addrQuery, setAddrQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setFieldErr(e => ({ ...e, [k]: '' }));
  }

  function toggleIssue(issue) {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(issue)
        ? f.issues.filter(i => i !== issue)
        : [...f.issues, issue],
    }));
  }

  async function searchAddr(e) {
    e.preventDefault();
    if (!addrQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' +
        encodeURIComponent(addrQuery),
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
      );
      const results = await res.json();
      if (results[0]) {
        setPin({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
        setPinAddr(results[0].display_name.split(',').slice(0, 2).join(','));
        setFieldErr(e => ({ ...e, address: '' }));
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (!pin) errs.address = 'We need your address to schedule a pickup.';
    if (Object.keys(errs).length) { setFieldErr(errs); return; }
    setSubmitting(true);
    setErr('');
    try {
      const res = await fetch(BASE + '/api/bookings', {
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
      onSuccess(data.booking.id);
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = {
    width: '100%', padding: '10px 13px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#1a202c', fontFamily: 'inherit',
  };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit}>
      {err && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#c53030', fontSize: 14 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lbl}>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="Your name"
            style={{ ...inp, borderColor: fieldErr.name ? '#e53e3e' : '#e2e8f0' }}
          />
          {fieldErr.name && <span style={{ fontSize: 12, color: '#e53e3e' }}>Required</span>}
        </div>
        <div>
          <label style={lbl}>Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="(xxx) xxx-xxxx"
            style={{ ...inp, borderColor: fieldErr.phone ? '#e53e3e' : '#e2e8f0' }}
          />
          {fieldErr.phone && <span style={{ fontSize: 12, color: '#e53e3e' }}>Required</span>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setField('email', e.target.value)}
          placeholder="email@example.com"
          style={inp}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>How should we reach you?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['text', 'email'].map(opt => {
            const sel = form.contact_preference === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setField('contact_preference', opt)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: sel ? '2px solid #276749' : '1px solid #e2e8f0',
                  background: sel ? '#276749' : '#fff',
                  color: sel ? '#fff' : '#4a5568',
                  fontWeight: sel ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt === 'text' ? 'Text' : 'Email'}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Bike brand</label>
        <select
          value={form.bike_brand}
          onChange={e => setField('bike_brand', e.target.value)}
          style={{ ...inp, color: form.bike_brand ? '#1a202c' : '#a0aec0' }}
        >
          <option value="">Select (optional)</option>
          {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>What needs attention?</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {ISSUE_OPTIONS.map(issue => {
            const on = form.issues.includes(issue);
            return (
              <button
                key={issue}
                type="button"
                onClick={() => toggleIssue(issue)}
                style={{
                  padding: '6px 13px', borderRadius: 16, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit',
                  border: on ? '2px solid #276749' : '1px solid #e2e8f0',
                  background: on ? '#276749' : '#fff',
                  color: on ? '#fff' : '#4a5568',
                  transition: 'all 0.15s',
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
          <label style={lbl}>Preferred day</label>
          <select
            value={form.preferred_day}
            onChange={e => setField('preferred_day', e.target.value)}
            style={{ ...inp, color: form.preferred_day ? '#1a202c' : '#a0aec0' }}
          >
            <option value="">No preference</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Thursday">Thursday</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Preferred time</label>
          <select
            value={form.time_slot}
            onChange={e => setField('time_slot', e.target.value)}
            style={{ ...inp, color: form.time_slot ? '#1a202c' : '#a0aec0' }}
          >
            <option value="">No preference</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setField('notes', e.target.value)}
          placeholder="Access instructions, anything specific about the bike..."
          rows={2}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Pickup location — always visible */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...lbl, color: fieldErr.address ? '#e53e3e' : '#4a5568' }}>Pickup location *</label>
        <form onSubmit={searchAddr} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            type="text"
            value={addrQuery}
            onChange={e => setAddrQuery(e.target.value)}
            placeholder="Search your address..."
            style={{ ...inp, flex: 1 }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              padding: '8px 14px', background: '#276749', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            {searching ? '...' : 'Find'}
          </button>
        </form>
        <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + (fieldErr.address ? '#e53e3e' : '#e2e8f0') }}>
          <ServiceMap
            pin={pin}
            onMapClick={(lat, lng) => { setPin({ lat, lng }); setPinAddr(''); setFieldErr(e => ({ ...e, address: '' })); }}
          />
        </div>
        {pin ? (
          <p style={{ fontSize: 12, color: '#718096', marginTop: 6 }}>
            {pinAddr || Number(pin.lat).toFixed(5) + ', ' + Number(pin.lng).toFixed(5)}
            {' '}
            <button
              type="button"
              onClick={() => { setPin(null); setPinAddr(''); }}
              style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              clear
            </button>
          </p>
        ) : (
          <p style={{ fontSize: 12, color: '#a0aec0', marginTop: 6 }}>
            Search above or click the map to drop a pin.
          </p>
        )}
        {fieldErr.address && (
          <p style={{ fontSize: 13, color: '#e53e3e', marginTop: 6, fontWeight: 500 }}>
            {fieldErr.address}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', padding: '13px 0',
          background: submitting ? '#a0aec0' : '#276749',
          color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 16, fontWeight: 600, cursor: submitting ? 'default' : 'pointer',
          fontFamily: 'inherit', letterSpacing: '0.01em',
        }}
      >
        {submitting ? 'Booking...' : 'Book a Pickup'}
      </button>

      <p style={{ fontSize: 12, color: '#a0aec0', textAlign: 'center', marginTop: 8 }}>
        {'We\'ll confirm a time within 24 hours.'}
      </p>
    </form>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ bookingId }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
      <div style={{ width: 52, height: 52, background: '#f0fff4', border: '2px solid #9ae6b4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
        {'\u2713'}
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', marginBottom: 8, fontFamily: 'inherit' }}>
        Got it.
      </h3>
      <p style={{ color: '#718096', fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
        {'We\'ll reach out to confirm a time. Usually within a day.'}
      </p>
      {bookingId && (
        <a
          href={'/embed/service/' + bookingId}
          style={{
            display: 'inline-block', padding: '11px 28px',
            background: '#276749', color: '#fff', borderRadius: 10,
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Track your booking
        </a>
      )}
    </div>
  );
}

// ─── More from One Love cards ─────────────────────────────────────────────────

function MoreCards() {
  const cards = [
    {
      href: BASE + '/fix-or-ride',
      bg: '#fffbeb', border: '#fde68a', hborder: '#d97706',
      color: '#d97706', label: 'Fix or Ride?',
      desc: 'Got a bike collecting dust? Tell us what is wrong. We will tell you if it is worth fixing.',
    },
    {
      href: BASE + '/custom-builds',
      bg: '#f0fff4', border: '#c6f6d5', hborder: '#276749',
      color: '#276749', label: 'Custom Builds',
      desc: 'Independent builders. Fitted to your body. Components chosen for quality, not a catalog. Budget $5k and up.',
    },
    {
      href: BASE + '/membership',
      bg: '#faf5ff', border: '#e9d8fd', hborder: '#805ad5',
      color: '#805ad5', label: 'Membership',
      desc: 'Free pickup and dropoff. Priority service. Seasonal tune-up. $25/month.',
    },
  ];

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a0aec0', textAlign: 'center', marginBottom: 14 }}>
        More from One Love
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cards.map(card => (
          <a
            key={card.href}
            href={card.href}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', gap: 12, padding: '13px 14px', borderRadius: 12,
              background: card.bg, border: '1px solid ' + card.border,
              textDecoration: 'none', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = card.hborder}
            onMouseLeave={e => e.currentTarget.style.borderColor = card.border}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: card.color, marginBottom: 3, fontFamily: 'inherit' }}>
                {card.label} {'\u2192'}
              </div>
              <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: 'inherit' }}>
                {card.desc}
              </div>
            </div>
          </a>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e0', marginTop: 16 }}>
        A One Love Outdoors 501(c)(3) project
      </p>
    </div>
  );
}

// ─── Main embed page ──────────────────────────────────────────────────────────

export default function EmbedService() {
  const [bookingId, setBookingId] = useState(null);
  const containerRef = useRef(null);

  // Auto-resize: send height to parent frame via postMessage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function sendHeight() {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'lom-resize', height: h }, '*');
    }

    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.documentElement);
    sendHeight();

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        background: 'transparent',
        padding: '24px 20px 32px',
        maxWidth: 560,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1a202c', marginBottom: 4, lineHeight: 1.2 }}>
          We come to you.
        </h2>
        <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.5 }}>
          Pickup, fix, return. Book a service stop.
        </p>
      </div>

      {bookingId ? (
        <SuccessScreen bookingId={bookingId} />
      ) : (
        <BookingForm onSuccess={id => setBookingId(id)} />
      )}

      <MoreCards />
    </div>
  );
}
