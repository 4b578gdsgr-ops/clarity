'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../../lib/serviceArea';
import { saveProfile } from '../../../lib/pwaProfile';

const ServiceMap = dynamic(() => import('../ServiceMap'), { ssr: false });

const inp = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl = { display: 'block', fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 };

export default function PwaProfileSetup({ onDone }) {
  const [step, setStep] = useState('info'); // 'info' | 'location'
  const [form, setForm] = useState({ name: '', phone: '', email: '', contact_preference: 'text' });
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

  function validateInfo() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.contact_preference === 'email' && !form.email.trim()) errs.email = 'Email is required';
    return errs;
  }

  function handleInfoNext(e) {
    e.preventDefault();
    const errs = validateInfo();
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

  function handleSave() {
    saveProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      contact_preference: form.contact_preference,
      address: address || '',
      lat: pin?.lat || null,
      lng: pin?.lng || null,
    });
    onDone();
  }

  if (step === 'info') {
    return (
      <div style={{ minHeight: '100vh', background: '#fafaf7', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 900, color: '#1a3328', marginBottom: 8, lineHeight: 1.2 }}>
            Welcome to One Love Outdoors.
          </h1>
          <p style={{ color: '#636e72', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Let's get you set up.
          </p>

          <form onSubmit={handleInfoNext}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Your name *</label>
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

            <div style={{ marginBottom: 16 }}>
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

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="you@example.com"
                style={{ ...inp, borderColor: errors.email ? '#dc2626' : '#d1d5db' }}
              />
              {errors.email && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 3 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={lbl}>How should we reach you? *</label>
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
                        border: sel ? '2px solid #1a3328' : '1px solid #d1d5db',
                        background: sel ? '#1a3328' : '#fff',
                        color: sel ? '#fff' : '#374151',
                        fontWeight: sel ? 600 : 400,
                      }}
                    >
                      {opt === 'text' ? 'Text me' : 'Email me'}
                    </button>
                  );
                })}
              </div>
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
    <div style={{ minHeight: '100vh', background: '#fafaf7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 20px', width: '100%' }}>
        <button
          type="button"
          onClick={() => setStep('info')}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', fontFamily: 'inherit', padding: 0, marginBottom: 16 }}
        >
          Back
        </button>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 900, color: '#1a3328', marginBottom: 6 }}>
          Where should we usually meet?
        </h2>
        <p style={{ color: '#636e72', fontSize: 14, marginBottom: 16 }}>
          Home, office, trailhead — wherever works. You can change this any time.
        </p>

        <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 10, background: '#f3f4f6' }}>
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
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <p style={{ color: '#dc2626', fontSize: 14, margin: 0, fontWeight: 600 }}>
              That location is outside our service area — Hartford and Tolland counties, CT.
            </p>
          </div>
        )}

        {pin && !outside && (
          <p style={{ fontSize: 13, color: '#166534', marginBottom: 12 }}>
            Location set: <strong>{address || (pin.lat.toFixed(4) + ', ' + pin.lng.toFixed(4))}</strong>
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!pin || outside}
            style={{
              flex: 1, padding: '14px 0', background: (!pin || outside) ? '#9ca3af' : '#1a3328',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 16,
              cursor: (!pin || outside) ? 'default' : 'pointer', fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            Save and continue
          </button>
          <button
            type="button"
            onClick={() => { saveProfile({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), contact_preference: form.contact_preference, address: '', lat: null, lng: null }); onDone(); }}
            style={{ padding: '14px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
