'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../lib/serviceArea';
import { validateBooking } from '../../lib/bookingValidation';
import { getProfile } from '../../lib/pwaProfile';
import { saveBookingId } from '../../lib/pwaBookings';
import PhotoUpload from '../components/PhotoUpload';

const ServiceMap = dynamic(() => import('../components/ServiceMap'), { ssr: false });

const LS_KEY = 'ol_returning_user';

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
  { value: 'box_ship', label: 'Box & Ship' },
];

const ISSUE_OPTIONS_BY_TYPE = {
  bike:     ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'New bike assembly', 'Other'],
  wheelset: ['True', 'Hub service', 'Spoke tension', 'Tubeless setup', 'Bearing replacement'],
  fork:     ['Service', 'Seals', 'Damper', 'Air spring'],
  shock:    ['Service', 'Seals', 'Damper', 'Air spring'],
  other:    [],
  box_ship: [],
};

const BRAND_PLACEHOLDER = {
  bike:     '',
  wheelset: 'e.g. Industry Nine, DT Swiss, Mavic...',
  fork:     'e.g. Fox, RockShox, Marzocchi...',
  shock:    'e.g. Fox, RockShox, Cane Creek...',
  other:    'Brand or make (optional)',
  box_ship: '',
};

const BOX_SHIP_ESTIMATE_TEXT = "Box & ship pricing depends on the bike and destination. We'll quote after discussing the details.";

function itemDisplayLabel(type) {
  switch (type) {
    case 'wheelset': return 'Wheel';
    case 'fork':     return 'Fork';
    case 'shock':    return 'Shock';
    case 'other':    return 'Item';
    case 'box_ship': return 'Box & Ship';
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
  if (issues.length === 1 && hasOther) return "We'll take a look and give you a quote. No obligations.";
  if (nonOther.length >= 3) return "Sounds like it might need some love. We'll give you an honest quote after we see the bike — most full overhauls run $200–300.";
  if (hasSuspension) return "Suspension service starts at $150. We'll confirm the full scope after we see it.";
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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 24px' }}>
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#0f1a14', margin: '0 0 3px' }}>
          {'Where should we meet?'}
          {pin && !outside && <span style={{ color: '#16a34a', marginLeft: 8, fontSize: 17 }}>✓</span>}
        </p>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Home, office, trailhead — wherever works best for you.
        </p>
      </div>

      <div style={{ height: 340, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 10, background: '#f3f4f6' }}>
        <ServiceMap pin={pin} onMapClick={handleMapClick} showBoundary />
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Or search a street address"
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

      {!pin && (
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          Tap the map to drop a pin, or search above.
        </p>
      )}

      {pin && outside && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4, fontSize: 15 }}>
            {'We\'re not in your area yet.'}
          </p>
          <p style={{ color: '#7f1d1d', fontSize: 14, lineHeight: 1.5 }}>
            Reach out and we'll see what we can do:{' '}
            <a href="mailto:service@oneloveoutdoors.org" style={{ color: '#dc2626', fontWeight: 600 }}>
              service@oneloveoutdoors.org
            </a>
          </p>
        </div>
      )}

      {pin && !outside && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: '#166534', marginBottom: 12 }}>
            {'Your location: '}
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

// ─── Step 2+: Form (sub-stepped) ──────────────────────────────────────────────

function FormStep({ address, pin, onBack, onDone, initialMember = false, initialForm = null, pwaProfile = null }) {
  const [isMember, setIsMember] = useState(initialMember);
  const prefill = pwaProfile || initialForm;
  const [form, setForm] = useState({
    name: prefill?.name || '',
    phone: prefill?.phone || '',
    email: prefill?.email || '',
    contact_preference: prefill?.contact_preference || '',
    preferred_day: '', time_slot: '', notes: '',
  });
  const [bikes, setBikes] = useState([{ type: 'bike', brand: '', issues: [], notes: '', otherDescription: '', destination: '', bikeDetails: '', disassembly: false }]);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [subStep, setSubStep] = useState(pwaProfile ? 'service' : 'contact');

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  }

  function addBike() {
    if (bikes.length >= 5) return;
    setBikes(prev => [...prev, { type: 'bike', brand: '', issues: [], notes: '', otherDescription: '', destination: '', bikeDetails: '', disassembly: false }]);
  }
  function removeBike(idx) {
    setBikes(prev => prev.filter((_, i) => i !== idx));
    setErrors(e => ({ ...e, issues: '' }));
  }
  function updateBike(idx, key, val) {
    setBikes(prev => {
      const next = prev.map((b, i) => {
        if (i !== idx) return b;
        if (key === 'type') {
          return { ...b, type: val, issues: [], otherDescription: '', destination: '', bikeDetails: '', disassembly: false };
        }
        return { ...b, [key]: val };
      });
      // Box & Ship is single-item only — drop any other items when it's selected
      if (key === 'type' && val === 'box_ship') return [next[idx]];
      return next;
    });
    if (key === 'issues' || key === 'otherDescription' || key === 'destination' || key === 'bikeDetails') {
      setErrors(e => ({ ...e, issues: '' }));
    }
  }
  function toggleBikeIssue(idx, issue) {
    setBikes(prev => prev.map((b, i) => {
      if (i !== idx) return b;
      const issues = b.issues.includes(issue) ? b.issues.filter(x => x !== issue) : [...b.issues, issue];
      return { ...b, issues };
    }));
    setErrors(e => ({ ...e, issues: '' }));
  }

  function advanceFromContact() {
    const errs = {};
    const nameTrim = form.name.trim();
    if (nameTrim.length < 2) errs.name = nameTrim.length === 0 ? 'Required' : 'At least 2 characters';
    if (!form.contact_preference) errs.contact_preference = 'Choose how we should reach you';
    if (form.contact_preference === 'text') {
      const digits = (form.phone || '').replace(/\D/g, '');
      if (digits.length < 10) errs.phone = digits.length === 0 ? 'Required' : 'At least 10 digits';
    }
    if (form.contact_preference === 'email') {
      const e = (form.email || '').trim();
      const at = e.indexOf('@');
      if (!e) errs.email = 'Required';
      else if (at < 1 || !e.slice(at + 1).includes('.')) errs.email = 'Enter a valid email';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubStep('service');
  }

  function advanceFromService() {
    const first = bikes[0];
    if (first.type === 'box_ship') {
      if (!first.destination?.trim() || !first.bikeDetails?.trim()) {
        setErrors({ issues: 'Tell us where it\'s going and a bit about the bike' });
        return;
      }
    } else if (first.type === 'other') {
      if (!first.otherDescription?.trim()) { setErrors({ issues: 'Tell us what you have' }); return; }
    } else if (!first.issues.length) {
      setErrors({ issues: 'Select at least one' });
      return;
    }
    setErrors({});
    setSubStep('schedule');
  }

  const isAssembly = bikes.some(b => b.issues.includes('New bike assembly'));
  const submittedAddress = address || (pin ? `${Number(pin.lat).toFixed(4)}, ${Number(pin.lng).toFixed(4)}` : '');

  async function handleSubmit() {
    const errs = validateBooking({ ...form, address: submittedAddress, bikes });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitErr('');
    try {
      const photoUrls = photos.filter(p => p.url).map(p => p.url);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, address: submittedAddress || null, is_member: isMember, photos: photoUrls, lat: pin?.lat ?? null, lng: pin?.lng ?? null, bikes }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitErr(data.error || 'Something went wrong.'); return; }
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          name: form.name, phone: form.phone, email: form.email,
          address: submittedAddress,
          contact_preference: form.contact_preference,
          lat: pin?.lat ?? null, lng: pin?.lng ?? null,
        }));
      } catch {}
      saveBookingId(data.booking.id);
      onDone(data.booking.id, form.contact_preference, isAssembly);
    } catch {
      setSubmitErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 };
  const errStyle = { fontSize: 13, color: '#dc2626', marginTop: 3 };
  const wrap = { maxWidth: 640, margin: '0 auto', padding: '24px 16px' };

  // ── Sub-step: Contact ──
  if (subStep === 'contact') {
    return (
      <div style={wrap}>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#0f1a14', fontFamily: 'Playfair Display, serif', margin: '0 0 6px' }}>
          How should we reach you?
        </p>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          {"We'll confirm your pickup time via text or email."}
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...lbl, color: errors.contact_preference ? '#dc2626' : '#374151' }}>
            How should we reach you? *
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['text', 'email'].map(opt => {
              const sel = form.contact_preference === opt;
              return (
                <button key={opt} type="button" onClick={() => setField('contact_preference', opt)} style={{
                  flex: 1, padding: '11px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  border: sel ? '2px solid #1a3328' : ('1px solid ' + (errors.contact_preference ? '#dc2626' : '#d1d5db')),
                  background: sel ? '#1a3328' : '#fff',
                  color: sel ? '#fff' : '#374151',
                  fontWeight: sel ? 600 : 400,
                }}>
                  {opt === 'text' ? 'Text' : 'Email'}
                </button>
              );
            })}
          </div>
          {errors.contact_preference && <p data-field-error style={errStyle}>{errors.contact_preference}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Name *</label>
          <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name" style={{ ...inp, borderColor: errors.name ? '#dc2626' : '#d1d5db' }} />
          {errors.name && <p data-field-error style={errStyle}>{errors.name}</p>}
        </div>

        {form.contact_preference === 'text' && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Phone *</label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" style={{ ...inp, borderColor: errors.phone ? '#dc2626' : '#d1d5db' }} />
            {errors.phone && <p data-field-error style={errStyle}>{errors.phone}</p>}
          </div>
        )}

        {form.contact_preference === 'email' && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Email *</label>
            <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" style={{ ...inp, borderColor: errors.email ? '#dc2626' : '#d1d5db' }} />
            {errors.email && <p data-field-error style={errStyle}>{errors.email}</p>}
          </div>
        )}

        <button type="button" onClick={advanceFromContact} style={{ width: '100%', padding: '13px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 600, marginBottom: 14 }}>
          Continue
        </button>
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
            Back: change location
          </button>
        </div>
      </div>
    );
  }

  // ── Sub-step: Service ──
  if (subStep === 'service') {
    return (
      <div style={wrap}>
        {pwaProfile ? (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>What needs work?</p>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Booking for <strong>{pwaProfile.name}</strong>
              {pwaProfile.address ? <> &mdash; {pwaProfile.address.split(',').slice(0, 2).join(',').trim()}</> : null}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>{"What's going on?"}</p>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Tell us what needs work.</p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          {bikes.map((bike, bikeIdx) => {
            const itemType = bike.type || 'bike';
            const isBoxShip = itemType === 'box_ship';
            const bikeIsAssembly = itemType === 'bike' && bike.issues.includes('New bike assembly');
            const bikeEstimate = itemType === 'bike' ? getEstimateText(bike.issues) : null;
            const issueOpts = ISSUE_OPTIONS_BY_TYPE[itemType] || [];
            const displayLabel = itemDisplayLabel(itemType);
            const headerLabel = bikes.length > 1 ? displayLabel + ' ' + (bikeIdx + 1) : 'Your ' + displayLabel.toLowerCase();
            const typeOptions = bikeIdx === 0 ? ITEM_TYPES : ITEM_TYPES.filter(t => t.value !== 'box_ship');
            return (
              <div key={bikeIdx} style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: 14, marginBottom: bikeIdx < bikes.length - 1 ? 10 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1a14' }}>{headerLabel}</span>
                  {bikeIdx > 0 && (
                    <button type="button" onClick={() => removeBike(bikeIdx)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px', fontFamily: 'inherit' }}>×</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {typeOptions.map(t => (
                    <button key={t.value} type="button" onClick={() => updateBike(bikeIdx, 'type', t.value)} style={{
                      padding: '5px 12px', borderRadius: 16, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      border: itemType === t.value ? '2px solid #1a3328' : '1px solid #d1d5db',
                      background: itemType === t.value ? '#1a3328' : '#fff',
                      color: itemType === t.value ? '#fff' : '#374151',
                    }}>{t.label}</button>
                  ))}
                </div>
                {isBoxShip ? (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ ...lbl, color: errors.issues && bikeIdx === 0 ? '#dc2626' : '#374151' }}>
                        Where is the bike going? *
                      </label>
                      <input type="text" value={bike.destination || ''} onChange={e => updateBike(bikeIdx, 'destination', e.target.value)}
                        placeholder="Address, or e.g. &ldquo;shipping to buyer in Colorado&rdquo;"
                        style={{ ...inp, borderColor: errors.issues && bikeIdx === 0 && !bike.destination?.trim() ? '#dc2626' : '#d1d5db' }} />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ ...lbl, color: errors.issues && bikeIdx === 0 ? '#dc2626' : '#374151' }}>
                        Bike details *
                      </label>
                      <textarea value={bike.bikeDetails || ''} onChange={e => updateBike(bikeIdx, 'bikeDetails', e.target.value)}
                        placeholder="Brand, model, year, anything special..." rows={2}
                        style={{ ...inp, resize: 'vertical', lineHeight: 1.5, borderColor: errors.issues && bikeIdx === 0 && !bike.bikeDetails?.trim() ? '#dc2626' : '#d1d5db' }} />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!bike.disassembly} onChange={e => updateBike(bikeIdx, 'disassembly', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#1a3328', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: '#374151' }}>Include disassembly?</span>
                      </label>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl}>Notes</label>
                      <textarea value={bike.notes || ''} onChange={e => updateBike(bikeIdx, 'notes', e.target.value)}
                        placeholder="Anything else we should know..." rows={2}
                        style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
                    </div>
                    <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, margin: 0 }}>{BOX_SHIP_ESTIMATE_TEXT}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={lbl}>Brand</label>
                      {itemType === 'bike' ? (
                        <select value={bike.brand} onChange={e => updateBike(bikeIdx, 'brand', e.target.value)} style={{ ...inp, color: bike.brand ? '#111827' : '#9ca3af' }}>
                          <option value="">Select (optional)</option>
                          {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={bike.brand} onChange={e => updateBike(bikeIdx, 'brand', e.target.value)} placeholder={BRAND_PLACEHOLDER[itemType] || 'Brand (optional)'} style={inp} />
                      )}
                    </div>
                    {itemType === 'other' ? (
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ ...lbl, color: errors.issues && bikeIdx === 0 ? '#dc2626' : '#374151' }}>
                          Tell us what you've got {bikeIdx === 0 ? '*' : ''}
                        </label>
                        <input type="text" value={bike.otherDescription || ''} onChange={e => updateBike(bikeIdx, 'otherDescription', e.target.value)}
                          placeholder="Describe the item and what it needs..."
                          style={{ ...inp, borderColor: errors.issues && bikeIdx === 0 ? '#dc2626' : '#d1d5db' }} />
                      </div>
                    ) : (
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ ...lbl, color: errors.issues && bikeIdx === 0 ? '#dc2626' : '#374151' }}>
                          What needs attention? {bikeIdx === 0 ? '*' : ''}
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {issueOpts.map(issue => {
                            const on = bike.issues.includes(issue);
                            return (
                              <button key={issue} type="button" onClick={() => toggleBikeIssue(bikeIdx, issue)} style={{
                                padding: '7px 14px', borderRadius: 20, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                                border: on ? '2px solid #1a3328' : ('1px solid ' + (errors.issues && bikeIdx === 0 ? '#dc2626' : '#d1d5db')),
                                background: on ? '#1a3328' : '#fff',
                                color: on ? '#fff' : '#374151',
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
                      <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                        <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, margin: 0 }}>{bikeEstimate}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {errors.issues && <p data-field-error style={errStyle}>{errors.issues}</p>}
          {bikes.length < 5 && bikes[0]?.type !== 'box_ship' && (
            <button type="button" onClick={addBike} style={{ marginTop: 10, padding: '8px 0', background: '#fff', border: '1px dashed #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit', width: '100%' }}>
              + Add another item
            </button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>

        <button type="button" onClick={advanceFromService} style={{ width: '100%', padding: '13px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 600, marginBottom: 14 }}>
          Continue
        </button>
        {!pwaProfile && (
          <div style={{ textAlign: 'center' }}>
            <button type="button" onClick={() => setSubStep('contact')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Sub-step: Schedule ──
  if (subStep === 'schedule') {
    return (
      <div style={wrap}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0f1a14', margin: '0 0 6px' }}>
          Preferred pickup day and time
        </p>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          We run routes Monday, Wednesday, and Friday. Need a different day? Let us know in the notes.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Preferred day</label>
            <select value={form.preferred_day} onChange={e => setField('preferred_day', e.target.value)} style={{ ...inp, color: form.preferred_day ? '#111827' : '#9ca3af' }}>
              <option value="">No preference</option>
              <option value="Monday">Monday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Preferred time</label>
            <input type="time" value={form.time_slot} onChange={e => setField('time_slot', e.target.value)} min="08:00" max="17:00" style={{ ...inp, color: form.time_slot ? '#111827' : '#9ca3af' }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Access instructions, gate codes, anything we should know..." rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        <div style={{ marginBottom: 20, padding: '12px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={isMember} onChange={e => setIsMember(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#1a3328', cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>I'm a One Love member</span>
          </label>
          {!isMember && !initialMember && (
            <p style={{ fontSize: 12, color: '#15803d', margin: '6px 0 0 26px' }}>
              One Love members get priority scheduling and preferred pricing.{' '}
              <a href="https://oneloveoutdoors.org/onelove-members-only" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3328', fontWeight: 600 }}>Learn more →</a>
            </p>
          )}
        </div>

        <button type="button" onClick={() => setSubStep('review')} style={{ width: '100%', padding: '13px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 600, marginBottom: 14 }}>
          Review booking
        </button>
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={() => setSubStep('service')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Sub-step: Review ──
  const rl = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const rv = { fontSize: 14, color: '#111827', marginTop: 3 };
  return (
    <div style={wrap}>
      <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#0f1a14', margin: '0 0 6px' }}>
        Review your booking
      </p>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        {"Looks good? Hit Book service and we'll be in touch."}
      </p>

      {submitErr && (
        <p style={{ color: '#dc2626', fontSize: 14, background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {submitErr}
        </p>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={rl}>Location</div>
            <div style={rv}>{submittedAddress || 'Not set'}</div>
          </div>
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#1a3328', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Edit</button>
        </div>

        {!pwaProfile && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={rl}>Contact</div>
              <div style={rv}>{form.name}{form.phone ? ' · ' + form.phone : ''}{form.email ? ' · ' + form.email : ''}</div>
            </div>
            <button type="button" onClick={() => setSubStep('contact')} style={{ background: 'none', border: 'none', color: '#1a3328', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Edit</button>
          </div>
        )}

        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={rl}>{"What we're working on"}</div>
            {bikes.map((b, i) => (
              <div key={i} style={{ ...rv, marginTop: i === 0 ? 3 : 4 }}>
                {b.type === 'box_ship' ? (
                  <>
                    {'Box & Ship — ' + (b.destination || 'destination not set')}
                    {b.bikeDetails ? '. ' + b.bikeDetails : ''}
                    {b.disassembly ? '. Disassembly requested.' : ''}
                    {b.notes ? '. ' + b.notes : ''}
                  </>
                ) : (
                  <>
                    {itemDisplayLabel(b.type)}{b.brand ? ' — ' + b.brand : ''}
                    {b.type !== 'other' && b.issues.length > 0 ? ': ' + b.issues.join(', ') : ''}
                    {b.type === 'other' && b.otherDescription ? ': ' + b.otherDescription : ''}
                  </>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSubStep('service')} style={{ background: 'none', border: 'none', color: '#1a3328', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: '2px 0 0', flexShrink: 0, marginLeft: 12 }}>Edit</button>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={rl}>Pickup preference</div>
            <div style={rv}>{form.preferred_day || 'No preference'}{form.time_slot ? ' around ' + form.time_slot : ''}</div>
            {form.notes && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{form.notes}</div>}
          </div>
          <button type="button" onClick={() => setSubStep('schedule')} style={{ background: 'none', border: 'none', color: '#1a3328', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0, flexShrink: 0, marginLeft: 12 }}>Edit</button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ width: '100%', padding: '13px 0', background: submitting ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: submitting ? 'default' : 'pointer', fontWeight: 600, marginBottom: 14 }}
      >
        {submitting ? 'Sending...' : 'Book service'}
      </button>
      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={() => setSubStep('schedule')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
          Back
        </button>
      </div>
    </div>
  );
}

// ─── Save Contact ─────────────────────────────────────────────────────────────

function saveContact() {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:One Love Outdoors',
    'ORG:One Love Outdoors',
    'TEL;TYPE=WORK:8602817888',
    'EMAIL:service@oneloveoutdoors.org',
    'URL:https://oneloveoutdoors.org',
    'NOTE:Mobile bike service — text us anytime. oneloveoutdoors.org',
    'END:VCARD',
  ].join('\r\n');
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'one-love-outdoors.vcf';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────

function DoneStep({ bookingId, contactPreference, isAssembly, onReset, pwaMode = false }) {
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
      {!pwaMode && (
        <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
          {'Check your email (and spam folder) for a confirmation from service@oneloveoutdoors.org. Adding us to your contacts helps make sure you get our updates.'}
        </p>
      )}
      {bookingId && (
        <a
          href={'/service/' + bookingId}
          style={{ display: 'block', padding: '12px 0', marginBottom: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: 15, textDecoration: 'none', fontWeight: 600 }}
        >
          {'Track your booking \u2192'}
        </a>
      )}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 10 }}>
          Save our number for quick questions. For service, booking here is always the fastest way to get on the schedule.
        </p>
        <button
          type="button"
          onClick={saveContact}
          style={{ display: 'block', width: '100%', padding: '12px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Save contact
        </button>
      </div>
      {pwaMode ? (
        <a
          href="/"
          style={{ display: 'block', padding: '12px 0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 14, textDecoration: 'none' }}
        >
          Back to home
        </a>
      ) : (
        <button
          type="button"
          onClick={onReset}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
        >
          Book another service
        </button>
      )}
    </div>
  );
}

// ─── Welcome Back ─────────────────────────────────────────────────────────────

function WelcomeBackStep({ savedUser, onSameSpot, onDifferentLocation, onNotMe }) {
  const displayAddress = savedUser.address
    ? savedUser.address.split(',').slice(0, 2).join(',').trim()
    : 'your saved location';
  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#0f1a14', marginBottom: 10 }}>
        Hey {savedUser.name}.
      </h2>
      <p style={{ color: '#4b5563', fontSize: 18, marginBottom: 32, fontWeight: 500 }}>Same spot?</p>
      <button
        onClick={onSameSpot}
        style={{
          display: 'block', width: '100%', padding: '14px 20px', marginBottom: 12,
          background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 15, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontWeight: 600,
        }}
      >
        Same spot &mdash; {displayAddress}
      </button>
      <button
        onClick={onDifferentLocation}
        style={{
          display: 'block', width: '100%', padding: '14px 20px',
          background: '#fff', color: '#1a3328', border: '2px solid #1a3328', borderRadius: 10,
          fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
        }}
      >
        Different location
      </button>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          onClick={onNotMe}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}
        >
          Not {savedUser.name}?
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScheduleService() {
  const [step, setStep] = useState(null);
  const [returningUser, setReturningUser] = useState(null);
  const [pwaProfile, setPwaProfile] = useState(null);
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

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (standalone) {
      // If this page is the PWA entry point (old install with start_url=/schedule-service),
      // redirect to home. Only skip the redirect when the user explicitly navigated here
      // from within the app (referrer is same origin).
      let cameFromApp = false;
      try {
        cameFromApp = document.referrer !== '' &&
          new URL(document.referrer).hostname === window.location.hostname;
      } catch {}

      if (!cameFromApp) {
        window.location.replace('/');
        return;
      }

      const pwaProf = getProfile();
      if (pwaProf?.name && pwaProf?.phone) {
        setPwaProfile(pwaProf);
        setInitialMember(pwaProf.is_member || false);
        if (pwaProf.lat && pwaProf.lng) setPin({ lat: pwaProf.lat, lng: pwaProf.lng });
        setAddress(pwaProf.address || '');
        setStep('form');
        return;
      }
      // No profile — shouldn't happen if navigating from home, but redirect cleanly
      window.location.replace('/');
      return;
    }

    try {
      const raw = localStorage.getItem(LS_KEY);
      const user = raw ? JSON.parse(raw) : null;
      if (user?.name) {
        setReturningUser(user);
        setStep('welcome-back');
      } else {
        setStep('location');
      }
    } catch {
      setStep('location');
    }
  }, []);

  function handlePin(lat, lng) {
    if (lat === null) { setPin(null); setOutside(false); return; }
    setPin({ lat, lng });
    setOutside(!isInServiceArea(lat, lng));
  }

  function handleSameSpot() {
    if (returningUser.lat && returningUser.lng) {
      setPin({ lat: returningUser.lat, lng: returningUser.lng });
      setOutside(!isInServiceArea(returningUser.lat, returningUser.lng));
    }
    setAddress(returningUser.address || '');
    setStep('form');
  }

  function handleDifferentLocation() {
    setStep('location');
  }

  function handleNotMe() {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setReturningUser(null);
    setStep('location');
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

  if (step === null) return null;

  if (step === 'done') {
    return (
      <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
        <DoneStep bookingId={bookingId} contactPreference={contactPreference} isAssembly={bookingIsAssembly} onReset={reset} pwaMode={!!pwaProfile} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      {pwaProfile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
          <a href="/" style={{ fontSize: 14, color: '#2d8653', fontWeight: 600, textDecoration: 'none' }}>&larr; Home</a>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1a14' }}>Book service</span>
          <a href="/" style={{ fontSize: 14, color: '#2d8653', fontWeight: 600, textDecoration: 'none' }}>My bookings</a>
        </div>
      )}

      {step !== 'welcome-back' && !pwaProfile && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 0', gap: 8 }}>
          {['location', 'form'].map(s => (
            <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: step === s ? '#1a3328' : '#d1d5db' }} />
          ))}
        </div>
      )}

      {step === 'welcome-back' && (
        <WelcomeBackStep
          savedUser={returningUser}
          onSameSpot={handleSameSpot}
          onDifferentLocation={handleDifferentLocation}
          onNotMe={handleNotMe}
        />
      )}

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
          pin={pin}
          initialMember={initialMember}
          initialForm={returningUser}
          pwaProfile={pwaProfile}
          onBack={() => setStep('location')}
          onDone={(id, pref, assembly) => { setBookingId(id); setContactPreference(pref); setBookingIsAssembly(!!assembly); setStep('done'); }}
        />
      )}
    </main>
  );
}
