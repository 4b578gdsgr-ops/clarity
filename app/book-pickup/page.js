'use client';

import { useState } from 'react';
import { getZoneForZip, getAvailableSlots, ZONES } from '../../lib/zones';

const STEPS = ['location', 'slot', 'details', 'confirm'];

const BIKE_BRANDS = [
  `I don't know`, 'Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott', 'Canyon',
  'Santa Cruz', 'Yeti', 'Ibis', 'Pivot', 'Rocky Mountain', 'Norco', 'Marin',
  'Kona', 'Salsa', 'Surly', 'Bianchi', 'BMC', 'Pinarello', 'Other',
];

const ISSUE_OPTIONS = [
  { value: 'shifting',     label: 'Shifting / gears' },
  { value: 'brakes',       label: 'Brakes' },
  { value: 'wheels',       label: 'Wheels / tires' },
  { value: 'bb_noise',     label: 'Bottom bracket / creaking' },
  { value: 'headset',      label: 'Headset / steering' },
  { value: 'suspension',   label: 'Suspension' },
  { value: 'frame_damage', label: 'Frame damage' },
  { value: 'drivetrain',   label: 'Drivetrain / chain' },
  { value: 'tuneup',       label: 'General tune-up' },
  { value: 'feels_wrong',  label: `Something feels off` },
];

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{
          width: i === current ? 20 : 7, height: 7, borderRadius: 4,
          background: i === current ? '#2d8653' : i < current ? '#a8d5b8' : '#e5e0d8',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );
}

export default function BookPickup() {
  const [step, setStep] = useState(0);
  const [zip, setZip] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [zone, setZone] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '', email: '',
    bike_brand: '', bike_model: '', issues: [], notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  // Step 0 → 1: ZIP + member check
  const handleLocation = () => {
    const clean = zip.trim().slice(0, 5);
    if (clean.length !== 5) { setError('Enter a valid 5-digit ZIP code.'); return; }
    const z = getZoneForZip(clean);
    if (!z) {
      setError(`We don't currently service ZIP code ${clean}. We cover parts of central, south, and west Connecticut.`);
      return;
    }
    setZone(z);
    setSlots(getAvailableSlots(z, isMember));
    setError(null);
    setStep(1);
  };

  // Step 1 → 2: slot selection
  const handleSlot = (s) => {
    setSelectedSlot(s);
    setStep(2);
  };

  // Step 2 → 3: details form
  const handleDetails = () => {
    if (!form.name.trim() || !form.address.trim()) {
      setError('Name and address are required.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const toggleIssue = (val) => {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(val) ? f.issues.filter(i => i !== val) : [...f.issues, val],
    }));
  };

  // Step 3: submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          zip: zip.trim(),
          state: 'CT',
          pickup_date: selectedSlot.date,
          time_slot: selectedSlot.timeSlot,
          is_member: isMember,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Booking failed');
      setBooking(json.booking);
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  const zoneInfo = zone ? ZONES[zone] : null;

  // Success screen
  if (submitted) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚲</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: '#2d3436', marginBottom: 8 }}>
          You're booked.
        </h1>
        <p style={{ color: '#636e72', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
          We'll pick up your bike on{' '}
          <strong>{new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>{' '}
          between <strong>{selectedSlot.timeSlot}</strong>.
        </p>
        <div style={{ background: '#f0faf5', border: '1px solid #d1ead9', borderRadius: 12, padding: '16px 20px', textAlign: 'left', maxWidth: 360, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 12, color: '#636e72' }}><strong style={{ color: '#2d3436' }}>Name:</strong> {booking?.name}</div>
          <div style={{ fontSize: 12, color: '#636e72', marginTop: 4 }}><strong style={{ color: '#2d3436' }}>Address:</strong> {booking?.address}, {booking?.city}</div>
          {booking?.bike_brand && (
            <div style={{ fontSize: 12, color: '#636e72', marginTop: 4 }}><strong style={{ color: '#2d3436' }}>Bike:</strong> {booking.bike_brand} {booking.bike_model}</div>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
          We'll text or call to confirm. Questions? Reply to this page or reach out directly.
        </p>
        <a href="/" style={{ display: 'inline-block', marginTop: 20, color: '#2d8653', fontSize: 13, fontWeight: 600 }}>
          ← Back to Love Over Money
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 900, color: '#2d3436', marginBottom: 6 }}>
          Book a Pickup
        </h1>
        <p style={{ color: '#636e72', fontSize: 13, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
          We come to you. Drop off isn't required. We pick up, fix it, and bring it back.
        </p>
      </div>

      <StepDots current={step} />

      <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 16px rgba(45,134,83,0.06)' }}>

        {/* ── Step 0: Location ── */}
        {step === 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2d3436', marginBottom: 4 }}>Where are you?</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>We'll check if we service your area and show you available slots.</div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636e72', marginBottom: 6 }}>ZIP Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zip}
              onChange={e => { setZip(e.target.value); setError(null); }}
              placeholder="06111"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e0d8', borderRadius: 10, fontSize: 16, marginBottom: 16, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setIsMember(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${!isMember ? '#2d8653' : '#e5e0d8'}`, background: !isMember ? '#f0faf5' : '#fff', fontWeight: 600, fontSize: 13, color: !isMember ? '#2d8653' : '#636e72', cursor: 'pointer' }}
              >
                Not a member
              </button>
              <button
                onClick={() => setIsMember(true)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${isMember ? '#9333ea' : '#e5e0d8'}`, background: isMember ? '#f9f5ff' : '#fff', fontWeight: 600, fontSize: 13, color: isMember ? '#9333ea' : '#636e72', cursor: 'pointer' }}
              >
                Member ♥
              </button>
            </div>

            {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button
              onClick={handleLocation}
              style={{ width: '100%', padding: '12px', background: '#2d8653', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Check availability →
            </button>
          </div>
        )}

        {/* ── Step 1: Slot Selection ── */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
              ← Back
            </button>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2d3436', marginBottom: 4 }}>Choose a pickup slot</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
              {zoneInfo && (
                <span style={{ background: zoneInfo.color + '22', color: zoneInfo.color, padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 12 }}>
                  {zoneInfo.label} zone
                </span>
              )}
            </div>
            {!isMember && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 12 }}>
                <a href="/membership" style={{ color: '#9333ea', fontWeight: 600 }}>Members</a> get more slots and priority scheduling.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {slots.map((s, i) => {
                const d = new Date(s.date + 'T12:00:00');
                const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                return (
                  <button key={i} onClick={() => handleSlot(s)}
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e0d8', background: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2d8653'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e0d8'}
                  >
                    <span style={{ fontWeight: 600, color: '#2d3436', fontSize: 14 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#636e72' }}>{s.timeSlot}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
              ← Back
            </button>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2d3436', marginBottom: 16 }}>Your details</div>

            {[
              { key: 'name',    label: 'Your name',     placeholder: 'Nate', required: true },
              { key: 'address', label: 'Street address', placeholder: '123 Main St', required: true },
              { key: 'city',    label: 'City',           placeholder: 'Newington' },
              { key: 'phone',   label: 'Phone',          placeholder: '(860) 555-1234', type: 'tel' },
              { key: 'email',   label: 'Email',          placeholder: 'nate@example.com', type: 'email' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636e72', marginBottom: 4 }}>
                  {f.label}{f.required && <span style={{ color: '#dc2626' }}> *</span>}
                </label>
                <input
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e0d8', borderRadius: 9, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636e72', marginBottom: 4 }}>Bike brand</label>
              <select value={form.bike_brand} onChange={e => setForm(x => ({ ...x, bike_brand: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e0d8', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', background: '#fff' }}>
                <option value="">Select a brand</option>
                {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636e72', marginBottom: 4 }}>Bike model (optional)</label>
              <input
                type="text"
                value={form.bike_model}
                onChange={e => setForm(x => ({ ...x, bike_model: e.target.value }))}
                placeholder="Marlin 7, Allez, etc."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e0d8', borderRadius: 9, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#636e72', marginBottom: 8 }}>What needs attention?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ISSUE_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer', padding: '6px 8px', borderRadius: 8, border: `1px solid ${form.issues.includes(opt.value) ? '#2d8653' : '#e5e0d8'}`, background: form.issues.includes(opt.value) ? '#f0faf5' : '#fff' }}>
                    <input type="checkbox" checked={form.issues.includes(opt.value)} onChange={() => toggleIssue(opt.value)} style={{ accentColor: '#2d8653' }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636e72', marginBottom: 4 }}>Notes for Nate (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(x => ({ ...x, notes: e.target.value }))}
                rows={3}
                placeholder="Anything specific I should know..."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e0d8', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button onClick={handleDetails}
              style={{ width: '100%', padding: '12px', background: '#2d8653', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Review booking →
            </button>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
              ← Back
            </button>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2d3436', marginBottom: 16 }}>Confirm your pickup</div>

            <div style={{ background: '#f0faf5', border: '1px solid #d1ead9', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 13, lineHeight: 1.8 }}>
              <div><strong>Date:</strong> {selectedSlot && new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              <div><strong>Time:</strong> {selectedSlot?.timeSlot}</div>
              <div><strong>Name:</strong> {form.name}</div>
              <div><strong>Address:</strong> {form.address}{form.city ? `, ${form.city}` : ''}, CT {zip}</div>
              {form.phone && <div><strong>Phone:</strong> {form.phone}</div>}
              {form.bike_brand && <div><strong>Bike:</strong> {form.bike_brand} {form.bike_model}</div>}
              {form.issues.length > 0 && <div><strong>Issues:</strong> {form.issues.join(', ')}</div>}
              {form.notes && <div><strong>Notes:</strong> {form.notes}</div>}
              {isMember && <div><strong style={{ color: '#9333ea' }}>♥ Member booking</strong></div>}
            </div>

            {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: '100%', padding: '13px', background: submitting ? '#a8d5b8' : '#2d8653', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {submitting ? 'Booking...' : 'Confirm pickup →'}
            </button>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#b0b8b4', marginTop: 20 }}>
        We'll text or call to confirm your pickup. No payment due until work is complete.
      </p>
    </div>
  );
}
