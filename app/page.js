'use client';

import { useState, useRef } from 'react';
import { validateBooking, isFormValid } from '../lib/bookingValidation';

const ISSUE_OPTIONS = ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'Other'];

const BIKE_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Yeti',
  'Pivot', 'Ibis', 'Marin', 'Kona', 'Canyon', 'Scott', 'GT',
  'Surly', 'Salsa', 'Co-op Cycles', 'Other',
];

// ─── Service booking form ─────────────────────────────────────────────────────

function ServiceBooking() {
  const formRef = useRef(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    contact_preference: '',
    address: '',
    bike_brand: '', issues: [],
    preferred_day: '', time_slot: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [submitErr, setSubmitErr] = useState('');

  const canSubmit = isFormValid(form);

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  }

  function toggleIssue(issue) {
    setForm(f => ({ ...f, issues: f.issues.includes(issue) ? f.issues.filter(i => i !== issue) : [...f.issues, issue] }));
    setErrors(e => ({ ...e, issues: '' }));
  }

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
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitErr(data.error || 'Something went wrong.'); return; }
      setBookingId(data.booking.id);
    } catch {
      setSubmitErr('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setBookingId(null);
    setForm({ name: '', phone: '', email: '', contact_preference: '', address: '', bike_brand: '', issues: [], preferred_day: '', time_slot: '', notes: '' });
    setErrors({});
    setSubmitErr('');
  }

  const inp = {
    width: '100%', padding: '10px 13px', border: '1px solid #e5e0d8',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fff', fontFamily: 'inherit',
  };
  const lbl = { display: 'block', fontSize: 13, color: '#636e72', marginBottom: 3, fontWeight: 500 };
  const err = { fontSize: 12, color: '#dc2626', marginTop: 3, display: 'block' };

  if (bookingId) {
    const via = form.contact_preference === 'email' ? 'email' : 'text';
    return (
      <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#1a3328', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>
          Got it.
        </div>
        <p style={{ color: '#636e72', fontSize: 15, marginBottom: 12, lineHeight: 1.6 }}>
          {'We\'ll ' + via + ' you to confirm a time. Usually within a day.'}
        </p>
        <p style={{ color: '#636e72', fontSize: 13, marginBottom: 20, lineHeight: 1.7, maxWidth: 360, margin: '0 auto 20px' }}>
          {"We pick up and deliver on Mondays and Fridays. Most jobs are back to you within a week. If parts need to be ordered, we'll let you know."}
        </p>
        <a
          href={'/service/' + bookingId}
          style={{ display: 'inline-block', padding: '11px 28px', background: '#2d8653', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 12 }}
        >
          Track your booking
        </a>
        <div>
          <button
            type="button"
            onClick={reset}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}
          >
            Book another service
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {submitErr && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 13px', marginBottom: 14, color: '#dc2626', fontSize: 14 }}>
          {submitErr}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lbl}>Name *</label>
          <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name"
            style={{ ...inp, borderColor: errors.name ? '#dc2626' : '#e5e0d8' }} />
          {errors.name && <span data-field-error style={err}>{errors.name}</span>}
        </div>
        <div>
          <label style={lbl}>Phone *</label>
          <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(xxx) xxx-xxxx"
            style={{ ...inp, borderColor: errors.phone ? '#dc2626' : '#e5e0d8' }} />
          {errors.phone && <span data-field-error style={err}>{errors.phone}</span>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Email *</label>
        <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="you@example.com"
          style={{ ...inp, borderColor: errors.email ? '#dc2626' : '#e5e0d8' }} />
        {errors.email && <span data-field-error style={err}>{errors.email}</span>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...lbl, color: errors.contact_preference ? '#dc2626' : '#636e72' }}>
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
                  border: sel ? '2px solid #2d8653' : ('1px solid ' + (errors.contact_preference ? '#dc2626' : '#e5e0d8')),
                  background: sel ? '#2d8653' : '#fff',
                  color: sel ? '#fff' : '#4a5568',
                  fontWeight: sel ? 600 : 400,
                }}
              >
                {opt === 'text' ? 'Text' : 'Email'}
              </button>
            );
          })}
        </div>
        {errors.contact_preference && <span data-field-error style={err}>{errors.contact_preference}</span>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...lbl, color: errors.address ? '#dc2626' : '#636e72' }}>Pickup address *</label>
        <input type="text" value={form.address} onChange={e => setField('address', e.target.value)}
          placeholder="Street address (Hartford or Tolland county)"
          style={{ ...inp, borderColor: errors.address ? '#dc2626' : '#e5e0d8' }} />
        {errors.address && <span data-field-error style={err}>{errors.address}</span>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...lbl, color: errors.issues ? '#dc2626' : '#636e72' }}>What needs attention? *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ISSUE_OPTIONS.map(issue => {
            const on = form.issues.includes(issue);
            return (
              <button
                key={issue}
                type="button"
                onClick={() => toggleIssue(issue)}
                style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  border: on ? '2px solid #2d8653' : ('1px solid ' + (errors.issues ? '#dc2626' : '#e5e0d8')),
                  background: on ? '#2d8653' : '#fff',
                  color: on ? '#fff' : '#4a4a4a',
                }}
              >
                {issue}
              </button>
            );
          })}
        </div>
        {errors.issues && <span data-field-error style={err}>{errors.issues}</span>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Bike brand</label>
        <select value={form.bike_brand} onChange={e => setField('bike_brand', e.target.value)}
          style={{ ...inp, color: form.bike_brand ? '#2d3436' : '#9ca3af' }}>
          <option value="">Select (optional)</option>
          {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lbl}>Preferred day</label>
          <select value={form.preferred_day} onChange={e => setField('preferred_day', e.target.value)}
            style={{ ...inp, color: form.preferred_day ? '#2d3436' : '#9ca3af' }}>
            <option value="">No preference</option>
            <option value="Monday">Monday</option>
            <option value="Friday">Friday</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Preferred time</label>
          <select value={form.time_slot} onChange={e => setField('time_slot', e.target.value)}
            style={{ ...inp, color: form.time_slot ? '#2d3436' : '#9ca3af' }}>
            <option value="">No preference</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Notes</label>
        <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
          placeholder="Access instructions, anything specific about the bike..."
          rows={2}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      <button
        type="submit"
        disabled={submitting || !canSubmit}
        style={{
          width: '100%', padding: '13px 0',
          background: (submitting || !canSubmit) ? '#9ca3af' : 'linear-gradient(135deg, #2d8653, #1a6e3f)',
          color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600,
          cursor: (submitting || !canSubmit) ? 'default' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {submitting ? 'Booking...' : 'Book a Pickup'}
      </button>

      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
        Hartford and Tolland county. {'We\'ll confirm within 24 hours.'}
      </p>
    </form>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">

        {/* ── HERO ── */}
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 900, color: '#1a3328', marginBottom: 6, lineHeight: 1.2 }}>
            We come to you.
          </h1>
          <p style={{ color: '#636e72', fontSize: 15, lineHeight: 1.6 }}>
            Pickup Monday. Back by Friday. We handle the rest.
          </p>
        </div>

        {/* ── SERVICE BOOKING FORM ── */}
        <div className="mb-8 rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 24px rgba(45,134,83,0.08)' }}>
          <ServiceBooking />
        </div>

        {/* ── THREE CARDS ── */}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#9ca3af' }}>
            More from One Love
          </div>
          <div className="flex flex-col gap-3">
            <a href="/fix-or-ride" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#fde68a'}>
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
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#9333ea' }}>Membership</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Free pickup and dropoff. Priority service. Seasonal tune-up. $25/month.
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ── WHY WE DO THIS ── */}
        <div className="mb-8 px-5 py-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
            Why this exists
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#4a5568' }}>
            We had a bike shop in Connecticut. Community, Saturday mornings, kids getting their first real bike. Then it was gone — not dramatically, just the slow physics of how large money moves through an industry. We watched it happen for years before we had a name for it.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#4a5568' }}>
            One Love Outdoors exists because the outdoor community has always been good at taking care of each other. This is us doing that with whatever tools we have.
          </p>
          <a href="/about" style={{ fontSize: 13, color: '#2d8653', fontWeight: 600, textDecoration: 'none' }}>
            Read the full story
          </a>
        </div>

      </div>
    </div>
  );
}
