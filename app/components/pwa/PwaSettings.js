'use client';
import { useState } from 'react';
import { saveProfile, clearProfile } from '../../../lib/pwaProfile';

const inp = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl = { display: 'block', fontSize: 14, color: '#374151', marginBottom: 4, fontWeight: 500 };

export default function PwaSettings({ profile, onDone, onResetProfile }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    contact_preference: profile?.contact_preference || 'text',
    address: profile?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setSaved(false); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);

    let lat = profile?.lat || null;
    let lng = profile?.lng || null;

    if (form.address.trim() && form.address.trim() !== profile?.address) {
      try {
        const res = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' +
          encodeURIComponent(form.address),
          { headers: { 'User-Agent': 'OneLoveOutdoors/1.0' } }
        );
        const results = await res.json();
        if (results[0]) {
          lat = parseFloat(results[0].lat);
          lng = parseFloat(results[0].lon);
        }
      } catch {}
    }

    saveProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      contact_preference: form.contact_preference,
      address: form.address.trim(),
      lat,
      lng,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    clearProfile();
    onResetProfile();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafaf7' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'calc(16px + env(safe-area-inset-top))',
        borderBottom: '1px solid #e5e7eb', background: '#fff',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={onDone}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#2d8653', fontWeight: 600, padding: 0 }}
        >
          &larr; Home
        </button>
        <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#0f1a14', textAlign: 'center' }}>Settings</div>
        <div />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Name *</label>
            <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} style={inp} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Phone *</label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} style={inp} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Email</label>
            <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} style={inp} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Address (where we usually meet)</label>
            <input type="text" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Street address" style={inp} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={lbl}>Contact preference</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['text', 'email'].map(opt => {
                const sel = form.contact_preference === opt;
                return (
                  <button key={opt} type="button" onClick={() => setField('contact_preference', opt)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: sel ? '2px solid #1a3328' : '1px solid #d1d5db',
                    background: sel ? '#1a3328' : '#fff',
                    color: sel ? '#fff' : '#374151',
                    fontWeight: sel ? 600 : 400,
                  }}>
                    {opt === 'text' ? 'Text' : 'Email'}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim() || !form.phone.trim()}
            style={{
              width: '100%', padding: '13px 0',
              background: saved ? '#16a34a' : (!form.name.trim() || !form.phone.trim() || saving) ? '#9ca3af' : '#1a3328',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 16,
              cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', marginBottom: 16,
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 8 }}>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              style={{ background: 'none', border: '1px solid #d1d5db', color: '#9ca3af', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
            >
              Not {profile?.name}? Reset profile
            </button>
          ) : (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 14, color: '#991b1b', marginBottom: 12, fontWeight: 600 }}>
                This will clear your profile and all saved info. Continue?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleReset}
                  style={{ flex: 1, padding: '10px 0', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{ flex: 1, padding: '10px 0', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
