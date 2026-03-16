'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ServiceMap = dynamic(() => import('../components/ServiceMap'), { ssr: false });

const BIKE_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Yeti',
  'Pivot', 'Ibis', 'Marin', 'Kona', 'Rocky Mountain', 'Norco', 'Canyon',
  'Scott', 'Merida', 'Cube', 'GT', 'Schwinn', 'Mongoose', 'Co-op Cycles',
  'Surly', 'Salsa', 'Raleigh', 'Fuji', 'Diamondback', 'Other',
];

const ISSUE_OPTIONS = [
  'Shifting', 'Brakes', 'Wheels / Tires', 'Suspension',
  'Drivetrain', 'Tune-up', 'Other',
];

// ─── Step 1: Map ──────────────────────────────────────────────────────────────

function MapStep({ pin, pinAddress, onPin, onPinAddress, onNext }) {
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
        onPinAddress(results[0].display_name.split(',').slice(0, 2).join(','));
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
    onPinAddress('');
    setSearchErr('');
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#0f1a14', marginBottom: 6 }}>
        Schedule a Service
      </h1>
      <p style={{ color: '#4b5563', marginBottom: 24, lineHeight: 1.5 }}>
        Drop a pin where you want us to pick up your bike, or type your address below.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Street address or intersection"
          style={{
            flex: 1, padding: '10px 14px', border: '1px solid #d1d5db',
            borderRadius: 8, fontSize: 15, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: '10px 18px', background: '#1a3328', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
          }}
        >
          {searching ? '...' : 'Find'}
        </button>
      </form>

      {searchErr && (
        <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 8 }}>{searchErr}</p>
      )}

      <div style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12 }}>
        <ServiceMap pin={pin} onMapClick={handleMapClick} />
      </div>

      {pin ? (
        <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
          {'Pinned: '}
          {pinAddress || (pin.lat.toFixed(5) + ', ' + pin.lng.toFixed(5))}
          {' '}
          <button
            type="button"
            onClick={() => { onPin(null); onPinAddress(''); }}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
          >
            clear
          </button>
        </p>
      ) : (
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>
          No pin set yet. Click the map or search above.
        </p>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!pin}
        style={{
          width: '100%', padding: '13px 0', background: pin ? '#1a3328' : '#9ca3af',
          color: '#fff', border: 'none', borderRadius: 10, fontSize: 16,
          cursor: pin ? 'pointer' : 'default', transition: 'background 0.2s',
        }}
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step 2: Form ─────────────────────────────────────────────────────────────

function FormStep({ onSubmit, submitting, submitErr }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    bike_brand: '',
    issues: [],
    preferred_day: '',
    time_slot: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function toggleIssue(issue) {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(issue)
        ? f.issues.filter(i => i !== issue)
        : [...f.issues, issue],
    }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#0f1a14', marginBottom: 6 }}>
        About you and your bike
      </h2>
      <p style={{ color: '#4b5563', marginBottom: 24, fontSize: 15 }}>
        Just the basics. We will reach out to confirm a time.
      </p>

      {submitErr && (
        <p style={{ color: '#dc2626', fontSize: 14, background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {submitErr}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="Your name"
            style={{ ...inputStyle, borderColor: errors.name ? '#dc2626' : '#d1d5db' }}
          />
          {errors.name && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>{errors.name}</p>}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="(xxx) xxx-xxxx"
            style={{ ...inputStyle, borderColor: errors.phone ? '#dc2626' : '#d1d5db' }}
          />
          {errors.phone && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>{errors.phone}</p>}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setField('email', e.target.value)}
            placeholder="email@example.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Bike brand</label>
          <select
            value={form.bike_brand}
            onChange={e => setField('bike_brand', e.target.value)}
            style={{ ...inputStyle, color: form.bike_brand ? '#111827' : '#9ca3af' }}
          >
            <option value="">Select a brand (optional)</option>
            {BIKE_BRANDS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>What needs attention?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ISSUE_OPTIONS.map(issue => {
              const selected = form.issues.includes(issue);
              return (
                <button
                  key={issue}
                  type="button"
                  onClick={() => toggleIssue(issue)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
                    border: selected ? '2px solid #1a3328' : '1px solid #d1d5db',
                    background: selected ? '#1a3328' : '#fff',
                    color: selected ? '#fff' : '#374151',
                    transition: 'all 0.15s',
                  }}
                >
                  {issue}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Preferred day</label>
            <select
              value={form.preferred_day}
              onChange={e => setField('preferred_day', e.target.value)}
              style={{ ...inputStyle, color: form.preferred_day ? '#111827' : '#9ca3af' }}
            >
              <option value="">No preference</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Thursday">Thursday</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Preferred time</label>
            <select
              value={form.time_slot}
              onChange={e => setField('time_slot', e.target.value)}
              style={{ ...inputStyle, color: form.time_slot ? '#111827' : '#9ca3af' }}
            >
              <option value="">No preference</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Anything else we should know?</label>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder="Notes about your bike, access instructions, etc."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', padding: '13px 0',
            background: submitting ? '#9ca3af' : '#1a3328',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 16,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Sending...' : 'Request Service'}
        </button>
      </form>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────

function DoneStep() {
  return (
    <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#0f1a14', marginBottom: 16 }}>
        Got it.
      </h2>
      <p style={{ color: '#4b5563', fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
        {'We\'ll text you to confirm a time. Usually within a day or two.'}
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block', padding: '12px 28px',
          background: '#1a3328', color: '#fff', borderRadius: 10,
          textDecoration: 'none', fontSize: 15,
        }}
      >
        Back to home
      </a>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScheduleService() {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(null);
  const [pinAddress, setPinAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const handlePin = useCallback((lat, lng) => {
    if (lat === null) { setPin(null); return; }
    setPin({ lat, lng });
  }, []);

  async function handleSubmit(formData) {
    setSubmitting(true);
    setSubmitErr('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: pin ? pin.lat : null,
          lng: pin ? pin.lng : null,
          address: pinAddress || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitErr(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      setStep(3);
    } catch {
      setSubmitErr('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  if (step === 3) return <DoneStep />;

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#0f1a14', fontStyle: 'italic' }}>
            {'Love > Money'}
          </span>
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 0', gap: 8 }}>
        {[1, 2].map(n => (
          <div
            key={n}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: step === n ? '#1a3328' : '#d1d5db',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <MapStep
          pin={pin}
          pinAddress={pinAddress}
          onPin={handlePin}
          onPinAddress={setPinAddress}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <div>
          <FormStep onSubmit={handleSubmit} submitting={submitting} submitErr={submitErr} />
          <div style={{ textAlign: 'center', paddingBottom: 32 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
            >
              Back: change pickup location
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
