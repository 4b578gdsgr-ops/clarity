'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../../lib/serviceArea';
import { getPricingTier, getTierByDistance } from '../../../lib/servicePricing';
import { validateBooking, isFormValid } from '../../../lib/bookingValidation';

const ServiceMap = dynamic(() => import('../../components/ServiceMap'), { ssr: false });

const BIKE_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Yeti',
  'Pivot', 'Ibis', 'Marin', 'Kona', 'Canyon', 'Scott', 'GT',
  'Surly', 'Salsa', 'Co-op Cycles', 'Other',
];

const ISSUE_OPTIONS = ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'New bike assembly', 'Other'];

function getEstimateText(issues) {
  if (!issues.length) return '';

  if (issues.includes('New bike assembly')) {
    return "We'll need some details to quote assembly. We'll reach out with pricing before confirming pickup.";
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
    return "Sounds like it might need some love. We'll give you an honest quote after pickup — most full overhauls run $200–300.";
  }

  // Suspension alone or with one other item
  if (hasSuspension) {
    return "Suspension service starts at $150. We'll confirm the full scope after pickup.";
  }

  // Tune-up alone, or tune-up + one other thing — it's likely covered
  if (hasTuneup && nonOther.length <= 2) {
    return "A tune-up covers most of this. Usually around $95 + parts.";
  }

  // Default: 1–2 known items, no suspension, no tune-up
  return "Most jobs like this run $40–150. We'll confirm after seeing the bike.";
}

const BASE = 'https://clarity-pi-ten.vercel.app';

export default function EmbedService() {
  const [pin, setPin] = useState(null);
  const [address, setAddress] = useState('');
  const [outside, setOutside] = useState(false);
  const [pricingTier, setPricingTier] = useState(null); // { fee, zip } | null
  const [isMember, setIsMember] = useState(false);
  const [addrQuery, setAddrQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    contact_preference: '',
    bike_brand: '', issues: [],
    bike_details: '',
    preferred_day: '', time_slot: '', notes: '',
  });
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

  function applyPin(lat, lng, resolvedAddress, zip) {
    setPin({ lat, lng });
    // ZIP lookup is authoritative; distance-based fallback when ZIP not in tier list
    const tier = getPricingTier(zip);
    if (tier) {
      setOutside(false);
      setPricingTier(tier);
    } else if (isInServiceArea(lat, lng)) {
      setOutside(false);
      setPricingTier(getTierByDistance(lat, lng));
    } else {
      setOutside(true);
      setPricingTier(null);
    }
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
        const zip = results[0].address?.postcode?.slice(0, 5) || null;
        applyPin(lat, lng, resolved, zip);
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function handleMapClick(lat, lng) {
    // Optimistically set pin; geocode to get address + ZIP
    setPin({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
      );
      const data = await res.json();
      const resolved = data.display_name ? data.display_name.split(',').slice(0, 3).join(',').trim() : null;
      const zip = data.address?.postcode?.slice(0, 5) || null;
      applyPin(lat, lng, resolved, zip);
    } catch {
      // Geocode failed — fall back to polygon check with no address
      applyPin(lat, lng, null, null);
    }
  }

  function clearPin() {
    setPin(null);
    setAddress('');
    setOutside(false);
    setPricingTier(null);
    setIsMember(false);
    setAddrQuery('');
    setErrors(er => ({ ...er, address: '' }));
  }

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(er => ({ ...er, [k]: '' }));
  }

  function toggleIssue(issue) {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(issue) ? f.issues.filter(i => i !== issue) : [...f.issues, issue],
    }));
    setErrors(er => ({ ...er, issues: '' }));
  }

  const formRef = useRef(null);
  const isAssembly = form.issues.includes('New bike assembly');
  const canSubmit = pin && !outside && isFormValid({ ...form, address });
  const estimateText = getEstimateText(form.issues);

  async function handleSubmit(e) {
    e.preventDefault();
    // Validate address separately
    if (!pin || outside) {
      setErrors(er => ({ ...er, address: pin ? 'Address is outside our service area.' : 'Drop a pin or search your address.' }));
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const errs = validateBooking({ ...form, address });
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
      const res = await fetch(BASE + '/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          address: address || null,
          lat: pin ? pin.lat : null,
          lng: pin ? pin.lng : null,
          is_member: isMember,
          bike_details: form.bike_details || null,
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
    setForm({ name: '', phone: '', email: '', contact_preference: '', bike_brand: '', issues: [], bike_details: '', preferred_day: '', time_slot: '', notes: '' });
    setErrors({});
    setSubmitErr('');
    setBookingId(null);
  }

  const container = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: 'transparent',
    padding: '20px 16px 28px',
    maxWidth: 560,
    margin: '0 auto',
    boxSizing: 'border-box',
  };

  const inp = { width: '100%', padding: '10px 13px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1a202c', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 4 };
  const errStyle = { fontSize: 12, color: '#e53e3e', marginTop: 3, display: 'block' };

  // ── Confirmation screen ──
  if (bookingId) {
    const via = form.contact_preference === 'email' ? 'email' : 'text';
    const isAssembly = form.issues.includes('New bike assembly');
    return (
      <div style={container}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: 52, height: 52, background: '#f0fff4', border: '2px solid #9ae6b4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
            {'\u2713'}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', marginBottom: 8, fontFamily: 'inherit' }}>
            Got it.
          </h3>
          <p style={{ color: '#718096', fontSize: 15, marginBottom: 12, lineHeight: 1.6 }}>
            {isAssembly
              ? "Got it. We'll review the details and send you a quote before scheduling pickup."
              : 'We\'ll ' + via + ' you to confirm a time. Usually within a day.'}
          </p>
          <p style={{ color: '#718096', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
            {"We pick up and deliver on Mondays and Fridays. Most jobs are back to you within a week. If parts need to be ordered, we'll let you know."}
          </p>
          <a
            href={'/embed/service/' + bookingId}
            style={{ display: 'inline-block', padding: '11px 28px', background: '#276749', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', marginBottom: 14 }}
          >
            Track your booking
          </a>
          <div>
            <button
              type="button"
              onClick={reset}
              style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              Book another service
            </button>
          </div>

          {!isMember && (
            <div style={{ marginTop: 28, padding: '14px 16px', background: '#f0faf5', border: '1px solid #c6e8d5', borderRadius: 10, textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.6, margin: '0 0 10px' }}>
                Want free pickup next time? Join One Love Membership — $25/month, free pickup & delivery, priority service.
              </p>
              <a
                href="/embed/membership"
                style={{ fontSize: 13, fontWeight: 600, color: '#276749', textDecoration: 'none' }}
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
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a202c', marginBottom: 4, marginTop: 0 }}>
        We come to you.
      </h2>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.5, marginBottom: 4 }}>
        Pickup Monday. Back by Friday.<sup style={{ fontSize: 10 }}>*</sup>
      </p>
      <p style={{ fontSize: 12, color: '#a0aec0', marginBottom: 16 }}>
        *parts permitting
      </p>

      <form ref={formRef} onSubmit={handleSubmit}>
        {submitErr && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#c53030', fontSize: 14 }}>
            {submitErr}
          </div>
        )}

        {/* ── Map (this IS the address) ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={addrQuery}
              onChange={e => setAddrQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchAddr(e); } }}
              placeholder="Search your address..."
              style={{ ...inp, flex: 1 }}
            />
            <button
              type="button"
              onClick={searchAddr}
              disabled={searching}
              style={{ padding: '8px 14px', background: '#276749', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
            >
              {searching ? '...' : 'Find'}
            </button>
          </div>

          <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: errors.address ? '1px solid #e53e3e' : '1px solid #e2e8f0', marginBottom: 6 }}>
            <ServiceMap
              pin={pin}
              onMapClick={handleMapClick}
              showBoundary
            />
          </div>

          {/* Address confirmation / hints */}
          {!pin && (
            <p style={{ fontSize: 12, color: '#a0aec0' }}>
              Search above or click the map to set your pickup location.
            </p>
          )}
          {pin && outside && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c53030', marginBottom: 2 }}>
                Not in our service area yet.
              </p>
              <p style={{ fontSize: 12, color: '#742a2a', lineHeight: 1.5 }}>
                <a href="mailto:service@oneloveoutdoors.org" style={{ color: '#c53030' }}>Reach out</a> and we'll see what we can do.
              </p>
            </div>
          )}
          {pin && !outside && (
            <div>
              <div style={{ background: '#f0faf5', border: '1px solid #c6e8d5', borderRadius: 8, padding: '10px 14px', marginTop: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#276749', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  In service area ✓
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#276749', marginBottom: 3 }}>
                  {isMember
                    ? 'Free pickup & delivery (member) ✓'
                    : `Pickup & delivery: $${pricingTier ? pricingTier.fee : 25}`}
                </p>
                {!isMember && (
                  <p style={{ fontSize: 12, color: '#4a7c5f', marginBottom: 6 }}>
                    Members get free pickup & delivery.{' '}
                    <a
                      href="/embed/membership"
                      style={{ color: '#276749', fontWeight: 600 }}
                    >
                      $25/month →
                    </a>
                  </p>
                )}
                <p style={{ fontSize: 12, color: '#4a7c5f', lineHeight: 1.5, marginBottom: 8 }}>
                  Labor and parts quoted after we see the bike. No surprises.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMember}
                    onChange={e => setIsMember(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: '#276749', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: '#276749', fontWeight: 500 }}>
                    I'm a One Love member — pickup & delivery is free
                  </span>
                </label>
                <p style={{ fontSize: 12, color: '#4a7c5f', marginTop: 6 }}>
                  {address || 'Location set'}{' '}
                  <button
                    type="button"
                    onClick={clearPin}
                    style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}
                  >
                    clear
                  </button>
                </p>
              </div>
            </div>
          )}
          {errors.address && <span data-field-error style={errStyle}>{errors.address}</span>}
        </div>

        {/* ── Name + Phone ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Name *</label>
            <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name" style={{ ...inp, borderColor: errors.name ? '#e53e3e' : '#e2e8f0' }} />
            {errors.name && <span data-field-error style={errStyle}>{errors.name}</span>}
          </div>
          <div>
            <label style={lbl}>Phone *</label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={{ ...inp, borderColor: errors.phone ? '#e53e3e' : '#e2e8f0' }} />
            {errors.phone && <span data-field-error style={errStyle}>{errors.phone}</span>}
          </div>
        </div>

        {/* ── Email ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Email *</label>
          <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" style={{ ...inp, borderColor: errors.email ? '#e53e3e' : '#e2e8f0' }} />
          {errors.email && <span data-field-error style={errStyle}>{errors.email}</span>}
        </div>

        {/* ── Contact preference ── */}
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
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: sel ? '2px solid #276749' : ('1px solid ' + (errors.contact_preference ? '#e53e3e' : '#e2e8f0')),
                    background: sel ? '#276749' : '#fff',
                    color: sel ? '#fff' : '#4a5568',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {opt === 'text' ? 'Text' : 'Email'}
                </button>
              );
            })}
          </div>
          {errors.contact_preference && <span data-field-error style={errStyle}>{errors.contact_preference}</span>}
        </div>

        {/* ── Bike brand ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Bike brand</label>
          <select value={form.bike_brand} onChange={e => setField('bike_brand', e.target.value)} style={{ ...inp, color: form.bike_brand ? '#1a202c' : '#a0aec0' }}>
            <option value="">Select (optional)</option>
            {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* ── What needs attention ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...lbl, color: errors.issues ? '#e53e3e' : '#4a5568' }}>What needs attention? *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {ISSUE_OPTIONS.map(issue => {
              const on = form.issues.includes(issue);
              return (
                <button
                  key={issue}
                  type="button"
                  onClick={() => toggleIssue(issue)}
                  style={{
                    padding: '6px 13px', borderRadius: 16, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '2px solid #276749' : ('1px solid ' + (errors.issues ? '#e53e3e' : '#e2e8f0')),
                    background: on ? '#276749' : '#fff',
                    color: on ? '#fff' : '#4a5568',
                  }}
                >
                  {issue}
                </button>
              );
            })}
          </div>
          {errors.issues && <span data-field-error style={errStyle}>{errors.issues}</span>}
        </div>

        {/* ── Bike details (assembly only) ── */}
        {isAssembly && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...lbl, color: errors.bike_details ? '#e53e3e' : '#4a5568' }}>Tell us about the bike *</label>
            <input
              type="text"
              value={form.bike_details}
              onChange={e => setField('bike_details', e.target.value)}
              placeholder="Brand, model, year, where you ordered it from..."
              style={{ ...inp, borderColor: errors.bike_details ? '#e53e3e' : '#e2e8f0' }}
            />
            {errors.bike_details && <span data-field-error style={errStyle}>{errors.bike_details}</span>}
          </div>
        )}

        {/* ── Estimate hint ── */}
        {estimateText && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f0faf5', borderRadius: 8, border: '1px solid #c6e8d5' }}>
            <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.5, margin: '0 0 3px' }}>
              {estimateText}
            </p>
            <p style={{ fontSize: 11, color: '#6b9e82', margin: 0 }}>
              No surprises. We quote before we wrench.
            </p>
          </div>
        )}

        {/* ── Preferred pickup day + time ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
          <div>
            <label style={lbl}>Preferred pickup day</label>
            <select value={form.preferred_day} onChange={e => setField('preferred_day', e.target.value)} style={{ ...inp, color: form.preferred_day ? '#1a202c' : '#a0aec0' }}>
              <option value="">No preference</option>
              <option value="Monday">Monday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Preferred pickup time</label>
            <input type="time" value={form.time_slot} onChange={e => setField('time_slot', e.target.value)} min="08:00" max="17:00" style={{ ...inp, color: form.time_slot ? '#1a202c' : '#a0aec0' }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#a0aec0', lineHeight: 1.5, marginBottom: 12 }}>
          We run pickup and delivery routes on Mondays and Fridays. Pick whichever works best. Need a different day? Let us know in the notes and we'll do our best.
        </p>

        {/* ── Notes ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder={isAssembly ? "Anything else — how it ships, box dimensions, e-bike, etc." : "Access instructions, anything specific about the bike..."}
            rows={2}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          style={{ width: '100%', padding: '13px 0', background: (submitting || !canSubmit) ? '#a0aec0' : '#276749', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: (submitting || !canSubmit) ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em' }}
        >
          {submitting ? 'Booking...' : 'Book Service'}
        </button>

        <p style={{ fontSize: 12, color: '#a0aec0', textAlign: 'center', marginTop: 8 }}>
          {'We\'ll confirm a time within 24 hours.'}
        </p>
      </form>
    </div>
  );
}
