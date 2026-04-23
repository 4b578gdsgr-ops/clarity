'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../../lib/serviceArea';
import { validateBooking, isFormValid } from '../../../lib/bookingValidation';
import PhotoUpload from '../../components/PhotoUpload';

const ServiceMap = dynamic(() => import('../../components/ServiceMap'), { ssr: false });

const MEMBERSHIP_PAGE_URL = 'https://oneloveoutdoors.org/onelove-members-only';

const BIKE_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Yeti',
  'Pivot', 'Ibis', 'Marin', 'Kona', 'Canyon', 'Scott', 'GT',
  'Surly', 'Salsa', 'Co-op Cycles', 'Other',
];

const ISSUE_OPTIONS = ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'New bike assembly', 'Other'];

const ITEM_TYPES = [
  { value: 'bike',     label: 'Bike' },
  { value: 'wheelset', label: 'Wheel/Wheelset' },
  { value: 'fork',     label: 'Fork' },
  { value: 'shock',    label: 'Shock' },
  { value: 'other',    label: 'Other' },
];

const ISSUE_OPTIONS_BY_TYPE = {
  bike:     ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'New bike assembly', 'Other'],
  wheelset: ['True', 'Hub service', 'Spoke tension', 'Tubeless setup', 'Bearing replacement'],
  fork:     ['Service', 'Seals', 'Damper', 'Air spring'],
  shock:    ['Service', 'Seals', 'Damper', 'Air spring'],
  other:    [],
};

const BRAND_PLACEHOLDER = {
  bike:     '',
  wheelset: 'e.g. Industry Nine, DT Swiss, Mavic...',
  fork:     'e.g. Fox, RockShox, Marzocchi...',
  shock:    'e.g. Fox, RockShox, Cane Creek...',
  other:    'Brand or make (optional)',
};

function itemDisplayLabel(type) {
  switch (type) {
    case 'wheelset': return 'Wheel';
    case 'fork':     return 'Fork';
    case 'shock':    return 'Shock';
    case 'other':    return 'Item';
    default:         return 'Bike';
  }
}

function getEstimateText(issues) {
  if (!issues.length) return '';

  if (issues.includes('New bike assembly')) {
    return "We'll need some details to quote assembly. We'll reach out with pricing before scheduling.";
  }

  const hasOther      = issues.includes('Other');
  const hasSuspension = issues.includes('Suspension');
  const hasTuneup     = issues.includes('Tune-up');
  const nonOther      = issues.filter(i => i !== 'Other');

  if (issues.length === 1 && hasOther) {
    return "We'll take a look and give you a quote. No obligations.";
  }

  // Lots of things going on — overhaul conversation takes priority
  if (nonOther.length >= 3) {
    return "Sounds like it might need some love. We'll give you an honest quote after we see the bike — most full overhauls run $200–300.";
  }

  // Suspension alone or with one other item
  if (hasSuspension) {
    return "Suspension service starts at $150. We'll confirm the full scope after we see it.";
  }

  // Tune-up alone, or tune-up + one other thing — it's likely covered
  if (hasTuneup && nonOther.length <= 2) {
    return "A tune-up covers most of this. Usually around $95 + parts.";
  }

  // Default: 1–2 known items, no suspension, no tune-up
  return "Most jobs like this run $40–150. We'll confirm after seeing the bike.";
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';

export default function EmbedService() {
  const [pin, setPin] = useState(null);
  const [address, setAddress] = useState('');
  const [outside, setOutside] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [memberPrefilled, setMemberPrefilled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('member') === 'true') {
      setIsMember(true);
      setMemberPrefilled(true);
    }
  }, []);
  const [addrQuery, setAddrQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    contact_preference: '',
    preferred_day: '', time_slot: '', notes: '',
  });
  const [bikes, setBikes] = useState([{ type: 'bike', brand: '', issues: [], notes: '', otherDescription: '' }]);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [bookingId, setBookingId] = useState(null);

  // Auto-resize: send height to parent frame
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function sendHeight() {
      window.parent.postMessage({ type: 'lom-resize', height: document.documentElement.scrollHeight }, '*');
    }
    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.documentElement);
    sendHeight();
    return () => ro.disconnect();
  }, []);

  function applyPin(lat, lng, resolvedAddress) {
    setPin({ lat, lng });
    setOutside(!isInServiceArea(lat, lng));
    if (resolvedAddress) {
      setAddress(resolvedAddress);
      setErrors(er => ({ ...er, address: '' }));
    } else {
      setAddress('');
    }
  }

  async function searchAddr(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!addrQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=1&q=' +
        encodeURIComponent(addrQuery),
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
      );
      const results = await res.json();
      if (results[0]) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        const resolved = results[0].display_name.split(',').slice(0, 3).join(',').trim();
        applyPin(lat, lng, resolved);
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function handleMapClick(lat, lng) {
    applyPin(lat, lng, null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
      );
      const data = await res.json();
      const resolved = data.display_name ? data.display_name.split(',').slice(0, 3).join(',').trim() : null;
      applyPin(lat, lng, resolved);
    } catch { /* ignore — pin and service check already set */ }
  }

  function clearPin() {
    setPin(null);
    setAddress('');
    setOutside(false);
    setIsMember(false);
    setMemberPrefilled(false);
    setAddrQuery('');
    setErrors(er => ({ ...er, address: '' }));
  }

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(er => ({ ...er, [k]: '' }));
  }

  function addBike() {
    if (bikes.length >= 5) return;
    setBikes(prev => [...prev, { type: 'bike', brand: '', issues: [], notes: '', otherDescription: '' }]);
  }
  function removeBike(idx) {
    setBikes(prev => prev.filter((_, i) => i !== idx));
    setErrors(er => ({ ...er, issues: '' }));
  }
  function updateBike(idx, key, val) {
    setBikes(prev => prev.map((b, i) => {
      if (i !== idx) return b;
      if (key === 'type') return { ...b, type: val, issues: [], otherDescription: '' };
      return { ...b, [key]: val };
    }));
    if (key === 'issues' || key === 'otherDescription') setErrors(er => ({ ...er, issues: '' }));
  }
  function toggleBikeIssue(idx, issue) {
    setBikes(prev => prev.map((b, i) => {
      if (i !== idx) return b;
      const issues = b.issues.includes(issue) ? b.issues.filter(x => x !== issue) : [...b.issues, issue];
      return { ...b, issues };
    }));
    setErrors(er => ({ ...er, issues: '' }));
  }

  const formRef = useRef(null);
  const mapRef = useRef(null);
  const isAssembly = bikes.some(b => b.issues.includes('New bike assembly'));
  const allIssues = bikes.flatMap(b => b.issues);
  const canSubmit = pin && !outside && isFormValid({ ...form, address, bikes });

  async function handleSubmit(e) {
    e.preventDefault();
    // Validate address separately
    if (!pin || outside) {
      setErrors(er => ({ ...er, address: pin ? 'Address is outside our service area.' : 'Please set your pickup location first.' }));
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const errs = validateBooking({ ...form, address, bikes });
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTimeout(() => {
        formRef.current?.querySelector('[data-field-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setSubmitting(true);
    setSubmitErr('');
    try {
      const photoUrls = photos.filter(p => p.url).map(p => p.url);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          address: address || null,
          lat: pin ? pin.lat : null,
          lng: pin ? pin.lng : null,
          is_member: isMember,
          photos: photoUrls,
          bikes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitErr(data.error || 'Something went wrong.'); return; }
      setBookingId(data.booking.id);
    } catch {
      setSubmitErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPin(null);
    setAddress('');
    setOutside(false);
    setAddrQuery('');
    setForm({ name: '', phone: '', email: '', contact_preference: '', preferred_day: '', time_slot: '', notes: '' });
    setBikes([{ type: 'bike', brand: '', issues: [], notes: '', otherDescription: '' }]);
    setErrors({});
    setSubmitErr('');
    setBookingId(null);
  }

  const container = {
    fontFamily: 'var(--ol-font-body)',
    background: 'var(--ol-bg)',
    padding: '20px 16px 28px',
    maxWidth: 560,
    margin: '0 auto',
    color: 'var(--ol-text)',
  };

  const inp = { width: '100%', padding: '10px 13px', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'var(--ol-bg-input)', color: 'var(--ol-text)', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ol-text-muted)', marginBottom: 4, letterSpacing: '0.01em' };
  const errStyle = { fontSize: 12, color: 'var(--ol-border-error)', marginTop: 3, display: 'block' };

  // ── Confirmation screen ──
  if (bookingId) {
    const via = form.contact_preference === 'email' ? 'email' : 'text';
    const confirmedIsAssembly = bikes.some(b => b.issues.includes('New bike assembly'));
    return (
      <div style={container}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: 48, height: 48, background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, color: 'var(--ol-accent)' }}>
            ✓
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 8, fontFamily: 'var(--ol-font-heading)' }}>
            Got it.
          </h3>
          <p style={{ color: 'var(--ol-text-muted)', fontSize: 15, marginBottom: 10, lineHeight: 1.6 }}>
            {confirmedIsAssembly
              ? "Got it. We'll review the details and send you a quote before scheduling pickup."
              : 'We\'ll ' + via + ' you to confirm a time. Usually within a day.'}
          </p>
          <p style={{ color: 'var(--ol-text-hint)', fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
            {'Check your email (and spam folder) for a confirmation from service@oneloveoutdoors.org. Adding us to your contacts helps make sure you get our updates.'}
          </p>
          <p style={{ color: 'var(--ol-text-hint)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
            {"We pick up and deliver on Mondays and Fridays. Most jobs are back to you within a week. If parts need to be ordered, we'll let you know."}
          </p>
          <a
            href={'/embed/service/' + bookingId}
            style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--ol-btn-bg)', color: 'var(--ol-btn-text)', borderRadius: 'var(--ol-radius-md)', textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', marginBottom: 14, letterSpacing: '0.02em' }}
          >
            Track your booking
          </a>
          <div>
            <button
              type="button"
              onClick={reset}
              style={{ background: 'none', border: 'none', color: 'var(--ol-text-hint)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              Book another service
            </button>
          </div>

          {!isMember && !memberPrefilled && (
            <div style={{ marginTop: 28, padding: '14px 16px', background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-lg)', textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
                One Love members get priority scheduling and preferred pricing.
              </p>
              <a
                href={MEMBERSHIP_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-accent)', textDecoration: 'none' }}
              >
                Learn more →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 4, marginTop: 0, fontFamily: 'var(--ol-font-heading)' }}>
        Your bike will thank you.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
        Tell us what's going on and where to meet you.
      </p>

      <form ref={formRef} onSubmit={handleSubmit}>
        {submitErr && (
          <div style={{ background: 'var(--ol-bg-error)', border: '1px solid var(--ol-border-error)', borderRadius: 'var(--ol-radius-md)', padding: '10px 14px', marginBottom: 14, color: 'var(--ol-border-error)', fontSize: 14 }}>
            {submitErr}
          </div>
        )}

        {/* ── Map (this IS the address) ── */}
        <div ref={mapRef} style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ol-text)', margin: '0 0 3px' }}>
              Where should we meet?
              {pin && !outside && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓</span>}
            </p>
            <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', margin: 0 }}>
              Home, office, trailhead — wherever works best for you.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={addrQuery}
              onChange={e => setAddrQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchAddr(e); } }}
              placeholder="Search your address..."
              style={{
                ...inp, flex: 1,
                border: pin && !outside ? '2px solid #16a34a' : '2px solid #d1d5db',
                background: pin && !outside ? '#f0fdf4' : 'var(--ol-bg-input)',
              }}
            />
            <button
              type="button"
              onClick={searchAddr}
              disabled={searching}
              style={{ padding: '8px 14px', background: 'var(--ol-btn-bg)', color: 'var(--ol-btn-text)', border: 'none', borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, letterSpacing: '0.02em' }}
            >
              {searching ? '...' : 'Find'}
            </button>
          </div>

          <div style={{ height: 220, borderRadius: 'var(--ol-radius-lg)', overflow: 'hidden', border: errors.address ? '1px solid var(--ol-border-error)' : '1px solid var(--ol-border)', marginBottom: 6 }}>
            <ServiceMap
              pin={pin}
              onMapClick={handleMapClick}
              showBoundary
            />
          </div>

          {/* Address confirmation / hints */}
          {!pin && (
            <p style={{ fontSize: 12, color: 'var(--ol-text-hint)' }}>
              Search above or tap the map to drop a pin.
            </p>
          )}
          {pin && outside && (
            <div style={{ background: 'var(--ol-bg-error)', border: '1px solid var(--ol-border-error)', borderRadius: 'var(--ol-radius-md)', padding: '10px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-border-error)', marginBottom: 2 }}>
                Not in our service area yet.
              </p>
              <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', lineHeight: 1.5 }}>
                <a href="mailto:service@oneloveoutdoors.org" style={{ color: 'var(--ol-border-error)' }}>Reach out</a> and we'll see what we can do.
              </p>
            </div>
          )}
          {pin && !outside && (
            <div>
              <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-md)', padding: '10px 14px', marginTop: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ol-accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  In service area ✓
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 3 }}>
                  We can meet you there.
                </p>
                <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                  Labor and parts quoted after we see the bike. No surprises.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMember}
                    onChange={e => setIsMember(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--ol-accent)', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--ol-text)', fontWeight: 500 }}>
                    I'm a One Love member
                  </span>
                </label>
                <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', marginTop: 6 }}>
                  {address || 'Location set'}{' '}
                  <button
                    type="button"
                    onClick={clearPin}
                    style={{ background: 'none', border: 'none', color: 'var(--ol-text-hint)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}
                  >
                    clear
                  </button>
                </p>
              </div>
            </div>
          )}
          {errors.address && <span data-field-error style={errStyle}>{errors.address}</span>}
        </div>

        {/* ── Contact preference — shown first ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...lbl, color: errors.contact_preference ? '#e53e3e' : '#4a5568' }}>
            How should we reach you? *
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['text', 'email'].map(opt => {
              const sel = form.contact_preference === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setField('contact_preference', opt)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: sel ? '2px solid var(--ol-chip-selected-border)' : ('1px solid ' + (errors.contact_preference ? 'var(--ol-border-error)' : 'var(--ol-chip-border)')),
                    background: sel ? 'var(--ol-chip-selected-bg)' : 'var(--ol-chip-bg)',
                    color: sel ? 'var(--ol-chip-selected-text)' : 'var(--ol-text-muted)',
                    fontWeight: sel ? 600 : 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  {opt === 'text' ? 'Text' : 'Email'}
                </button>
              );
            })}
          </div>
          {errors.contact_preference && <span data-field-error style={errStyle}>{errors.contact_preference}</span>}
        </div>

        {/* ── Name ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Name *</label>
          <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name" style={{ ...inp, borderColor: errors.name ? '#e53e3e' : '#e2e8f0' }} />
          {errors.name && <span data-field-error style={errStyle}>{errors.name}</span>}
        </div>

        {/* ── Phone — only if text selected ── */}
        {form.contact_preference === 'text' && (
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Phone *</label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={{ ...inp, borderColor: errors.phone ? '#e53e3e' : '#e2e8f0' }} />
            {errors.phone && <span data-field-error style={errStyle}>{errors.phone}</span>}
          </div>
        )}

        {/* ── Email — only if email selected ── */}
        {form.contact_preference === 'email' && (
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Email *</label>
            <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" style={{ ...inp, borderColor: errors.email ? '#e53e3e' : '#e2e8f0' }} />
            {errors.email && <span data-field-error style={errStyle}>{errors.email}</span>}
          </div>
        )}

        {/* ── Items ── */}
        <div style={{ marginBottom: 12 }}>
          {bikes.map((bike, bikeIdx) => {
            const itemType = bike.type || 'bike';
            const bikeIsAssembly = itemType === 'bike' && bike.issues.includes('New bike assembly');
            const bikeEstimate = itemType === 'bike' ? getEstimateText(bike.issues) : null;
            const issueOpts = ISSUE_OPTIONS_BY_TYPE[itemType] || [];
            const displayLabel = itemDisplayLabel(itemType);
            const headerLabel = bikes.length > 1
              ? displayLabel + ' ' + (bikeIdx + 1)
              : 'Your ' + displayLabel.toLowerCase();
            return (
              <div key={bikeIdx} style={{
                border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)',
                padding: 14, marginBottom: bikeIdx < bikes.length - 1 ? 10 : 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ol-text)' }}>{headerLabel}</span>
                  {bikeIdx > 0 && (
                    <button type="button" onClick={() => removeBike(bikeIdx)} style={{
                      background: 'none', border: 'none', color: 'var(--ol-text-hint)',
                      cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', fontFamily: 'inherit',
                    }}>×</button>
                  )}
                </div>
                {/* Type selector */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {ITEM_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => updateBike(bikeIdx, 'type', t.value)} style={{
                      padding: '4px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      border: itemType === t.value ? '2px solid var(--ol-chip-selected-border)' : '1px solid var(--ol-chip-border)',
                      background: itemType === t.value ? 'var(--ol-chip-selected-bg)' : 'var(--ol-chip-bg)',
                      color: itemType === t.value ? 'var(--ol-chip-selected-text)' : 'var(--ol-text-muted)',
                    }}>{t.label}</button>
                  ))}
                </div>
                {/* Brand */}
                <div style={{ marginBottom: 8 }}>
                  <label style={lbl}>Brand</label>
                  {itemType === 'bike' ? (
                    <select value={bike.brand} onChange={e => updateBike(bikeIdx, 'brand', e.target.value)}
                      style={{ ...inp, color: bike.brand ? 'var(--ol-text)' : '#a0aec0' }}>
                      <option value="">Select (optional)</option>
                      {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={bike.brand} onChange={e => updateBike(bikeIdx, 'brand', e.target.value)}
                      placeholder={BRAND_PLACEHOLDER[itemType] || 'Brand (optional)'}
                      style={inp} />
                  )}
                </div>
                {/* Issues / description */}
                {itemType === 'other' ? (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ ...lbl, color: errors.issues && bikeIdx === 0 ? 'var(--ol-border-error)' : '#4a5568' }}>
                      Tell us what you've got {bikeIdx === 0 ? '*' : ''}
                    </label>
                    <input type="text" value={bike.otherDescription || ''} onChange={e => updateBike(bikeIdx, 'otherDescription', e.target.value)}
                      placeholder="Describe the item and what it needs..."
                      style={{ ...inp, borderColor: errors.issues && bikeIdx === 0 ? 'var(--ol-border-error)' : undefined }} />
                  </div>
                ) : (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ ...lbl, color: errors.issues && bikeIdx === 0 ? '#e53e3e' : '#4a5568' }}>
                      What needs attention? {bikeIdx === 0 ? '*' : ''}
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {issueOpts.map(issue => {
                        const on = bike.issues.includes(issue);
                        return (
                          <button key={issue} type="button" onClick={() => toggleBikeIssue(bikeIdx, issue)} style={{
                            padding: '6px 13px', borderRadius: '20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                            border: on ? '2px solid var(--ol-chip-selected-border)' : ('1px solid ' + (errors.issues && bikeIdx === 0 ? 'var(--ol-border-error)' : 'var(--ol-chip-border)')),
                            background: on ? 'var(--ol-chip-selected-bg)' : 'var(--ol-chip-bg)',
                            color: on ? 'var(--ol-chip-selected-text)' : 'var(--ol-text-muted)',
                          }}>{issue}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {bikeIsAssembly && (
                  <div style={{ marginBottom: 8 }}>
                    <label style={lbl}>Tell us about the bike (optional)</label>
                    <input type="text" value={bike.notes} onChange={e => updateBike(bikeIdx, 'notes', e.target.value)}
                      placeholder="Brand, model, year, where you ordered it from..." style={inp} />
                  </div>
                )}
                {bikeEstimate && (
                  <div style={{ padding: '8px 12px', background: 'var(--ol-bg-callout)', borderRadius: 'var(--ol-radius-md)', border: '1px solid var(--ol-border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.5, margin: 0 }}>{bikeEstimate}</p>
                  </div>
                )}
              </div>
            );
          })}
          {errors.issues && <span data-field-error style={{ ...errStyle, display: 'block', marginTop: 6 }}>{errors.issues}</span>}
          {bikes.length < 5 && (
            <button type="button" onClick={addBike} style={{
              marginTop: 10, padding: '7px 14px',
              background: 'none', border: '1px dashed var(--ol-chip-border)',
              borderRadius: 'var(--ol-radius-md)', fontSize: 13, cursor: 'pointer',
              color: 'var(--ol-text-muted)', fontFamily: 'inherit', width: '100%',
            }}>
              + Add another item
            </button>
          )}
        </div>

        {/* ── Photos ── */}
        <div style={{ marginBottom: 14 }}>
          <PhotoUpload photos={photos} onChange={setPhotos} useVars />
        </div>

        {/* ── Preferred pickup day + time ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
          <div>
            <label style={lbl}>Preferred pickup day</label>
            <select value={form.preferred_day} onChange={e => setField('preferred_day', e.target.value)} style={{ ...inp, color: form.preferred_day ? '#1a202c' : '#a0aec0' }}>
              <option value="">No preference</option>
              <option value="Monday">Monday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Preferred pickup time</label>
            <input type="time" value={form.time_slot} onChange={e => setField('time_slot', e.target.value)} min="08:00" max="17:00" style={{ ...inp, color: form.time_slot ? '#1a202c' : '#a0aec0' }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ol-text-hint)', lineHeight: 1.5, marginBottom: 12 }}>
          We run routes on Mondays and Fridays. Pick whichever works best. Need a different day? Let us know in the notes.
        </p>

        {/* ── Notes ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder="Access instructions, gate codes, anything we should know..."
            rows={2}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          style={{ width: '100%', padding: '13px 0', background: (submitting || !canSubmit) ? 'var(--ol-btn-disabled)' : 'var(--ol-btn-bg)', color: 'var(--ol-btn-text)', border: 'none', borderRadius: 'var(--ol-radius-md)', fontSize: 15, fontWeight: 600, cursor: (submitting || !canSubmit) ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em' }}
        >
          {submitting ? 'Booking...' : 'Book Service'}
        </button>

        {!pin && (
          <p style={{ fontSize: 12, color: 'var(--ol-text-hint)', textAlign: 'center', marginTop: 6 }}>
            Drop a pin above to continue
          </p>
        )}

        <p style={{ fontSize: 12, color: 'var(--ol-text-hint)', textAlign: 'center', marginTop: pin ? 8 : 4 }}>
          {'We\'ll confirm a time within 24 hours.'}
        </p>
      </form>
    </div>
  );
}
