'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../../lib/serviceArea';
import { saveProfile } from '../../../lib/pwaProfile';

const ServiceMap = dynamic(() => import('../ServiceMap'), { ssr: false });

const inp = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl = { display: 'block', fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 };

export default function PwaProfileSetup({ onDone }) {
  const [step, setStep] = useState('info');
  const [form, setForm] = useState({ name: '', phone: '', is_member: false });
  const [errors, setErrors] = useState({});
  const [pin, setPin] = useState(null);
  const [address, setAddress] = useState('');
  const [outside, setOutside] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  }

  function handleInfoNext(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep('location');
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' +
        encodeURIComponent(searchQuery),
        { headers: { 'User-Agent': 'OneLoveOutdoors/1.0' } }
      );
      const results = await res.json();
      if (results[0]) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setPin({ lat, lng });
        setOutside(!isInServiceArea(lat, lng));
        setAddress(results[0].display_name.split(',').slice(0, 3).join(',').trim());
      } else {
        setSearchErr('Address not found. Try clicking the map.');
      }
    } catch {
      setSearchErr('Search failed. Try clicking the map.');
    } finally {
      setSearching(false);
    }
  }

  function handleMapClick(lat, lng) {
    setPin({ lat, lng });
    setOutside(!isInServiceArea(lat, lng));
    setAddress('');
    setSearchErr('');
  }

  function finish(withLocation) {
    saveProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      is_member: form.is_member,
      contact_preference: 'text',
      address: withLocation ? (address || '') : '',
      lat: withLocation ? (pin?.lat || null) : null,
      lng: withLocation ? (pin?.lng || null) : null,
    });
    onDone();
  }

  if (step === 'info') {
    return (
      <div style={{ minHeight: '100dvh', background: '#fafaf7', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 900, color: '#1a3328', marginBottom: 6, lineHeight: 1.2 }}>
            Welcome to One Love Outdoors.
          </h1>
          <p style={{ color: '#636e72', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Let's get you set up so we know who you are.
          </p>

          <form onSubmit={handleInfoNext}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="First name is fine"
                style={{ ...inp, borderColor: errors.name ? '#dc2626' : '#d1d5db' }}
                autoFocus
              />
              {errors.name && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 3 }}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="(xxx) xxx-xxxx"
                style={{ ...inp, borderColor: errors.phone ? '#dc2626' : '#d1d5db' }}
              />
              {errors.phone && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 3 }}>{errors.phone}</p>}
            </div>

            <div style={{ marginBottom: 28, padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_member}
                  onChange={e => setField('is_member', e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: '#1a3328', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>I'm a One Love member</span>
              </label>
              <p style={{ fontSize: 12, color: '#15803d', margin: '5px 0 0 27px' }}>
                Members get free pickup, priority service, and preferred pricing.
              </p>
            </div>

            <button
              type="submit"
              style={{ width: '100%', padding: '14px 0', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
            >
              Next: set your location
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fafaf7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 20px', width: '100%' }}>
        <button
          type="button"
          onClick={() => setStep('info')}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', fontFamily: 'inherit', padding: 0, marginBottom: 16 }}
        >
          Back
        </button>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 900, color: '#1a3328', marginBottom: 4 }}>
          Where should we usually meet?
        </h2>
        <p style={{ color: '#636e72', fontSize: 14, marginBottom: 14 }}>
          Home, office, trailhead — wherever works. You can change this any time.
        </p>

        <div style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 10, background: '#f3f4f6' }}>
          <ServiceMap pin={pin} onMapClick={handleMapClick} showBoundary />
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search a street address"
            style={{ ...inp, flex: 1, borderColor: pin && !outside ? '#16a34a' : '#d1d5db' }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{ padding: '10px 18px', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {searching ? '...' : 'Find'}
          </button>
        </form>

        {searchErr && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{searchErr}</p>}

        {pin && outside && (
          <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Outside our service area (Hartford and Tolland counties, CT).
          </p>
        )}

        {pin && !outside && (
          <p style={{ fontSize: 13, color: '#166534', marginBottom: 8 }}>
            Location set: <strong>{address || (pin.lat.toFixed(4) + ', ' + pin.lng.toFixed(4))}</strong>
          </p>
        )}

        <button
          type="button"
          onClick={() => finish(true)}
          disabled={!pin || outside}
          style={{
            width: '100%', padding: '14px 0', marginTop: 8,
            background: (!pin || outside) ? '#9ca3af' : '#1a3328',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 16,
            cursor: (!pin || outside) ? 'default' : 'pointer', fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => finish(false)}
          style={{ width: '100%', padding: '12px 0', marginTop: 10, background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#9ca3af', fontFamily: 'inherit' }}
        >
          Skip — I'll add my address later
        </button>
      </div>
    </div>
  );
}
