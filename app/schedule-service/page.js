'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../lib/serviceArea';
import { validateBooking, isFormValid } from '../../lib/bookingValidation';
import PhotoUpload from '../components/PhotoUpload';

const ServiceMap = dynamic(() => import('../components/ServiceMap'), { ssr: false });

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
  if (issues.length === 1 && hasOther) return "We'll take a look and give you a quote. No obligations.";
  if (nonOther.length >= 3) return "Sounds like it might need some love. We'll give you an honest quote after pickup — most full overhauls run $200–300.";
  if (hasSuspension) return "Suspension service starts at $150. We'll confirm the full scope after pickup.";
  if (hasTuneup && nonOther.length <= 2) return "A tune-up covers most of this. Usually around $95 + parts.";
  return "Most jobs like this run $40–150. We'll confirm after seeing the bike.";
}

// ─── Step 1: Location ─────────────────────────────────────────────────────────

function LocationStep({ pin, address, outside, onPin, onAddress, onContinue }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' +
        encodeURIComponent(query),
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
      );
      const results = await res.json();
      if (results[0]) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        onPin(lat, lng);
        onAddress(results[0].display_name.split(',').slice(0, 3).join(',').trim());
      } else {
        setSearchErr('Address not found. Try clicking the map directly.');
      }
    } catch {
      setSearchErr('Search failed. Try clicking the map directly.');
    } finally {
      setSearching(false);
    }
  }

  function handleMapClick(lat, lng) {
    onPin(lat, lng);
    onAddress('');
    setSearchErr('');
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#0f1a14', marginBottom: 20 }}>
        Schedule a Service
      </h1>

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>
          {'Where should we pick up?'}
          {pin && !outside && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓</span>}
        </p>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Search your address or tap the map to drop a pin
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Street address or intersection"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 15, outline: 'none',
            border: pin && !outside ? '2px solid #16a34a' : '2px solid #d1d5db',
            background: pin && !outside ? '#f0fdf4' : '#fff',
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{ padding: '10px 18px', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}
        >
          {searching ? '...' : 'Find'}
        </button>
      </form>

      {searchErr && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{searchErr}</p>}

      <div style={{ height: 340, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12 }}>
        <ServiceMap pin={pin} onMapClick={handleMapClick} showBoundary />
      </div>

      {!pin && (
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>
          Drop a pin or search above. The shaded area shows our service area.
        </p>
      )}

      {pin && outside && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4, fontSize: 15 }}>
            {'We\'re not in your area yet.'}
          </p>
          <p style={{ color: '#7f1d1d', fontSize: 14, lineHeight: 1.5 }}>
            One Love currently serves Hartford and Tolland counties.
            Reach out if you would like to discuss options:{' '}
            <a href="mailto:service@oneloveoutdoors.org" style={{ color: '#dc2626', fontWeight: 600 }}>
              service@oneloveoutdoors.org
            </a>
          </p>
        </div>
      )}

      {pin && !outside && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: '#166534', marginBottom: 12 }}>
            {'Pickup location: '}
            <strong>{address || (Number(pin.lat).toFixed(5) + ', ' + Number(pin.lng).toFixed(5))}</strong>
            {' '}
            <button
              type="button"
              onClick={() => { onPin(null); onAddress(''); }}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
            >
              change
            </button>
          </p>
          <button
            type="button"
            onClick={onContinue}
            style={{ width: '100%', padding: '13px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Form ─────────────────────────────────────────────────────────────

function FormStep({ address, onBack, onDone, initialMember = false }) {
  const formRef = useRef(null);
  const [isMember, setIsMember] = useState(initialMember);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    contact_preference: '',
    address: address || '',
    bike_brand: '', issues: [],
    bike_details: '',
    preferred_day: '', time_slot: '', notes: '',
  });
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  }

  function toggleIssue(issue) {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(issue) ? f.issues.filter(i => i !== issue) : [...f.issues, issue],
    }));
    setErrors(e => ({ ...e, issues: '' }));
  }

  const isAssembly = form.issues.includes('New bike assembly');
  const estimateText = getEstimateText(form.issues);
  const canSubmit = isFormValid(form);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateBooking(form);
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
        body: JSON.stringify({ ...form, is_member: isMember, photos: photoUrls }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitErr(data.error || 'Something went wrong.'); return; }
      onDone(data.booking.id, form.contact_preference, form.issues.includes('New bike assembly'));
    } catch {
      setSubmitErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 };
  const errStyle = { fontSize: 13, color: '#dc2626', marginTop: 3 };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#0f1a14', marginBottom: 6 }}>
        About you and your bike
      </h2>
      <p style={{ color: '#4b5563', marginBottom: 24, fontSize: 15 }}>
        {'We\'ll reach out to confirm a time.'}
      </p>

      {submitErr && (
        <p style={{ color: '#dc2626', fontSize: 14, background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {submitErr}
        </p>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Name *</label>
            <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name" style={{ ...inp, borderColor: errors.name ? '#dc2626' : '#d1d5db' }} />
            {errors.name && <p data-field-error style={errStyle}>{errors.name}</p>}
          </div>
          <div>
            <label style={lbl}>Phone *</label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={{ ...inp, borderColor: errors.phone ? '#dc2626' : '#d1d5db' }} />
            {errors.phone && <p data-field-error style={errStyle}>{errors.phone}</p>}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Email *</label>
          <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" style={{ ...inp, borderColor: errors.email ? '#dc2626' : '#d1d5db' }} />
          {errors.email && <p data-field-error style={errStyle}>{errors.email}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...lbl, color: errors.contact_preference ? '#dc2626' : '#374151' }}>
            How should we reach you? *
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['text', 'email'].map(opt => {
              const sel = form.contact_preference === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setField('contact_preference', opt)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: sel ? '2px solid #1a3328' : ('1px solid ' + (errors.contact_preference ? '#dc2626' : '#d1d5db')),
                    background: sel ? '#1a3328' : '#fff',
                    color: sel ? '#fff' : '#374151',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {opt === 'text' ? 'Text' : 'Email'}
                </button>
              );
            })}
          </div>
          {errors.contact_preference && <p data-field-error style={errStyle}>{errors.contact_preference}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...lbl, color: errors.address ? '#dc2626' : '#374151' }}>Pickup address *</label>
          <input
            type="text"
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            placeholder="Street address"
            style={{ ...inp, borderColor: errors.address ? '#dc2626' : '#d1d5db' }}
          />
          {errors.address && <p data-field-error style={errStyle}>{errors.address}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Bike brand</label>
          <select value={form.bike_brand} onChange={e => setField('bike_brand', e.target.value)} style={{ ...inp, color: form.bike_brand ? '#111827' : '#9ca3af' }}>
            <option value="">Select (optional)</option>
            {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...lbl, color: errors.issues ? '#dc2626' : '#374151' }}>What needs attention? *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ISSUE_OPTIONS.map(issue => {
              const on = form.issues.includes(issue);
              return (
                <button
                  key={issue}
                  type="button"
                  onClick={() => toggleIssue(issue)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: on ? '2px solid #1a3328' : ('1px solid ' + (errors.issues ? '#dc2626' : '#d1d5db')),
                    background: on ? '#1a3328' : '#fff',
                    color: on ? '#fff' : '#374151',
                  }}
                >
                  {issue}
                </button>
              );
            })}
          </div>
          {errors.issues && <p data-field-error style={errStyle}>{errors.issues}</p>}
        </div>

        {estimateText && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.5, margin: '0 0 3px' }}>{estimateText}</p>
            <p style={{ fontSize: 12, color: '#15803d', margin: 0 }}>No surprises. We quote before we wrench.</p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>

        {isAssembly && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Tell us about the bike (optional)</label>
            <input
              type="text"
              value={form.bike_details}
              onChange={e => setField('bike_details', e.target.value)}
              placeholder="Brand, model, year, where you ordered it from..."
              style={inp}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 6 }}>
          <div>
            <label style={lbl}>Preferred pickup day</label>
            <select value={form.preferred_day} onChange={e => setField('preferred_day', e.target.value)} style={{ ...inp, color: form.preferred_day ? '#111827' : '#9ca3af' }}>
              <option value="">No preference</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Thursday">Thursday</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Preferred pickup time</label>
            <input type="time" value={form.time_slot} onChange={e => setField('time_slot', e.target.value)} min="08:00" max="17:00" style={{ ...inp, color: form.time_slot ? '#111827' : '#9ca3af' }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#a0aec0', lineHeight: 1.5, marginBottom: 16 }}>
          We run pickup and delivery routes on Mondays and Fridays. Pick whichever works best. Need a different day? Let us know in the notes and we'll do our best.
        </p>

        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder={isAssembly ? "Anything else — how it ships, box dimensions, e-bike, etc." : "Access instructions, anything specific about the bike..."}
            rows={3}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isMember}
              onChange={e => setIsMember(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#1a3328', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>
              I'm a One Love member
            </span>
          </label>
          {!isMember && !initialMember && (
            <p style={{ fontSize: 12, color: '#15803d', margin: '6px 0 0 26px' }}>
              One Love members get priority scheduling and preferred pricing.{' '}
              <a href="https://oneloveoutdoors.org/onelove-members-only" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3328', fontWeight: 600 }}>Learn more →</a>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          style={{ width: '100%', padding: '13px 0', background: (submitting || !canSubmit) ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: (submitting || !canSubmit) ? 'default' : 'pointer', fontWeight: 600 }}
        >
          {submitting ? 'Sending...' : 'Book Service'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
        >
          Back: change pickup location
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────

function DoneStep({ bookingId, contactPreference, isAssembly, onReset }) {
  const via = contactPreference === 'email' ? 'email' : 'text';
  return (
    <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#0f1a14', marginBottom: 16 }}>
        Got it.
      </h2>
      <p style={{ color: '#4b5563', fontSize: 17, lineHeight: 1.6, marginBottom: 12 }}>
        {isAssembly
          ? "Got it. We'll review the details and send you a quote before scheduling pickup."
          : 'We\'ll ' + via + ' you to confirm a time. Usually within a day.'}
      </p>
      <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
        {'Check your email (and spam folder) for a confirmation from service@oneloveoutdoors.org. Adding us to your contacts helps make sure you get our updates.'}
      </p>
      {bookingId && (
        <a
          href={'/service/' + bookingId}
          style={{ display: 'block', padding: '12px 0', marginBottom: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: 15, textDecoration: 'none', fontWeight: 600 }}
        >
          {'Track your booking \u2192'}
        </a>
      )}
      <button
        type="button"
        onClick={onReset}
        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
      >
        Book another service
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScheduleService() {
  const [step, setStep] = useState('location');
  const [pin, setPin] = useState(null);
  const [address, setAddress] = useState('');
  const [outside, setOutside] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [contactPreference, setContactPreference] = useState('');
  const [bookingIsAssembly, setBookingIsAssembly] = useState(false);
  const [initialMember, setInitialMember] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('member') === 'true') setInitialMember(true);
  }, []);

  function handlePin(lat, lng) {
    if (lat === null) { setPin(null); setOutside(false); return; }
    setPin({ lat, lng });
    setOutside(!isInServiceArea(lat, lng));
  }

  function reset() {
    setStep('location');
    setPin(null);
    setAddress('');
    setOutside(false);
    setBookingId(null);
    setContactPreference('');
    setBookingIsAssembly(false);
  }

  if (step === 'done') {
    return (
      <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#0f1a14', fontStyle: 'italic' }}>
              {'One Love Outdoors'}
            </span>
          </a>
        </div>
        <DoneStep bookingId={bookingId} contactPreference={contactPreference} isAssembly={bookingIsAssembly} onReset={reset} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#0f1a14', fontStyle: 'italic' }}>
            {'One Love Outdoors'}
          </span>
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 0', gap: 8 }}>
        {['location', 'form'].map(s => (
          <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: step === s ? '#1a3328' : '#d1d5db' }} />
        ))}
      </div>

      {step === 'location' && (
        <LocationStep
          pin={pin}
          address={address}
          outside={outside}
          onPin={handlePin}
          onAddress={setAddress}
          onContinue={() => setStep('form')}
        />
      )}

      {step === 'form' && (
        <FormStep
          address={address}
          initialMember={initialMember}
          onBack={() => setStep('location')}
          onDone={(id, pref, assembly) => { setBookingId(id); setContactPreference(pref); setBookingIsAssembly(!!assembly); setStep('done'); }}
        />
      )}
    </main>
  );
}
