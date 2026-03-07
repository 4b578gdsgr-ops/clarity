'use client';

import { useState } from 'react';

const BUDGET_RANGES = [
  '$3,000–$5,000',
  '$5,000–$7,000',
  '$7,000–$10,000',
  '$10,000–$15,000',
  '$15,000+',
];

const RIDING_STYLES = [
  'Trail / All-mountain',
  'Enduro / Aggressive',
  'XC / Cross-country',
  'Road / Endurance',
  'Gravel / Adventure',
  'Bikepacking / Touring',
  'Commuter / Urban',
  'Mixed / Not sure yet',
];

export default function CustomBuildForm({ prefill = {}, onSuccess }) {
  const [form, setForm] = useState({
    name: prefill.name || '',
    email: prefill.email || '',
    phone: '',
    budget_range: prefill.budget_range || '',
    riding_style: prefill.riding_style || '',
    dream_bike_description: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/custom-build-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bike_types: prefill.bike_types || [],
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      onSuccess?.();
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-3xl mb-3">♥</div>
        <div className="text-lg font-bold mb-2" style={{ color: '#2d3436', fontFamily: 'Playfair Display, serif' }}>
          We'll be in touch within 48 hours.
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#636e72' }}>
          Every custom build starts with a conversation. We're looking forward to it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Email *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Phone (optional)</label>
        <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
          placeholder="(860) 555-0100"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Budget range</label>
          <select value={form.budget_range} onChange={e => set('budget_range', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: form.budget_range ? '#2d3436' : '#9ca3af' }}>
            <option value="">Select...</option>
            {BUDGET_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Riding style</label>
          <select value={form.riding_style} onChange={e => set('riding_style', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: form.riding_style ? '#2d3436' : '#9ca3af' }}>
            <option value="">Select...</option>
            {RIDING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1" style={{ color: '#636e72' }}>Tell us about your dream bike</label>
        <textarea value={form.dream_bike_description} onChange={e => set('dream_bike_description', e.target.value)}
          placeholder="Anything you know: geometry preferences, brands you like, how you plan to use it, past bikes, what you loved or hated..."
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none leading-relaxed"
          style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
      </div>

      {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}

      <button onClick={handleSubmit} disabled={loading || !form.name || !form.email}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
        style={{
          background: (form.name && form.email) ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#d1ead9',
          cursor: (form.name && form.email) ? 'pointer' : 'default',
        }}>
        {loading ? 'Sending...' : 'Start the conversation →'}
      </button>

      <p className="text-center text-xs" style={{ color: '#9ca3af' }}>
        No commitment. Just a conversation. We'll reach back within 48 hours.
      </p>
    </div>
  );
}
