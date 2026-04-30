'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../../lib/serviceArea';

const ServiceMap = dynamic(() => import('../../components/ServiceMap'), { ssr: false });

function itemNoun(booking) {
  const items = booking.bikes;
  if (!items || items.length === 0) return { noun: 'bike', verb: 'is', them: 'it' };
  const types = [...new Set(items.map(b => b.type || 'bike'))];
  const count = items.length;
  const plural = count > 1;
  if (types.length > 1) return { noun: 'everything', verb: 'is', them: 'everything' };
  switch (types[0]) {
    case 'wheelset': return plural ? { noun: 'wheelsets', verb: 'are', them: 'them' } : { noun: 'wheelset', verb: 'is', them: 'it' };
    case 'fork':     return plural ? { noun: 'forks',     verb: 'are', them: 'them' } : { noun: 'fork',     verb: 'is', them: 'it' };
    case 'shock':    return plural ? { noun: 'shocks',    verb: 'are', them: 'them' } : { noun: 'shock',    verb: 'is', them: 'it' };
    case 'other':    return plural ? { noun: 'items',     verb: 'are', them: 'them' } : { noun: 'item',     verb: 'is', them: 'it' };
    default:         return plural ? { noun: 'bikes',     verb: 'are', them: 'them' } : { noun: 'bike',     verb: 'is', them: 'it' };
  }
}

function getStatusHeading(booking) {
  const { status, confirmed_date, confirmed_time, return_date } = booking;
  const { noun, verb } = itemNoun(booking);
  switch (status) {
    case 'new':
    case 'booked':
      return "We got you. We'll reach out shortly to set up a time.";
    case 'confirmed': {
      const day  = confirmed_date ? fmtDate(confirmed_date) : '';
      const time = confirmed_time ? fmtTime(confirmed_time) : '';
      const when = day && time ? `${day} around ${time}` : day || '';
      return when
        ? `All set for ${when}. We'll take it from here.`
        : "All set. We'll take it from here.";
    }
    case 'picked_up': // legacy
    case 'in_progress':
      return `Your ${noun} ${verb} with us. Working on it.`;
    case 'ready': {
      const ret = return_date ? fmtDate(return_date) : '';
      return ret
        ? `Your ${noun} ${verb} dialed and ready to roll. We'll have it back to you ${ret}.`
        : `Your ${noun} ${verb} dialed and ready to roll.`;
    }
    case 'out_for_delivery':
      return "On our way to you now.";
    case 'complete':
    case 'done':
    case 'delivered':
      return "Delivered. You're golden.";
    case 'no_show':
      return "We came by but missed you. Reach out when you're ready to reschedule.";
    default:
      return "We got you. We'll reach out shortly to set up a time.";
  }
}

const STATUS_LABEL = {
  new:             'Request received',
  confirmed:       'Confirmed',
  no_show:         'Missed pickup',
  picked_up:       'Picked up',
  in_progress:     'In progress',
  ready:           'Ready for delivery',
  out_for_delivery:'On its way',
  complete:        'Delivered',
  cancelled:       'Cancelled',
  // legacy
  done:            'Done',
  booked:          'Confirmed',
  delivered:       'Delivered',
};

const STATUS_STEPS = ['new', 'confirmed', 'in_progress', 'ready', 'out_for_delivery', 'complete'];

const STATUS_COLOR = {
  new:             '#f59e0b',
  confirmed:       '#3b82f6',
  picked_up:       '#f97316', // legacy — maps to in_progress color
  in_progress:     '#f97316',
  ready:           '#0ea5e9',
  out_for_delivery:'#2d8653',
  complete:        '#16a34a',
  done:            '#16a34a',
  cancelled:       '#9ca3af',
};

function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Returns the next occurrence of a named weekday as a YYYY-MM-DD string
function nextOccurrence(dayName) {
  const days = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
  const target = days[dayName];
  if (target === undefined) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let diff = target - today.getDay();
  if (diff <= 0) diff += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  const mo = String(result.getMonth() + 1).padStart(2, '0');
  const d = String(result.getDate()).padStart(2, '0');
  return `${result.getFullYear()}-${mo}-${d}`;
}

// Pre-compute delivery date options so they're stable during a session
const DELIVERY_DATE_OPTIONS = ['Monday', 'Wednesday', 'Friday'].map(day => ({
  date: nextOccurrence(day),
  label: fmtDate(nextOccurrence(day)),
}));

function fmtTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

const EDITABLE_STATUSES = new Set(['new', 'confirmed', 'in_progress', 'booked', 'picked_up']);

function PickupConfirmSection({ booking, bookingId, onUpdated, onOpenMessages }) {
  const [confirmed, setConfirmed] = useState(!!booking.confirmed_by_customer);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const day  = booking.confirmed_date ? fmtDate(booking.confirmed_date) : 'the scheduled day';
  const time = booking.confirmed_time ? ' around ' + fmtTime(booking.confirmed_time) : '';

  async function handleConfirm() {
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/bookings/' + bookingId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed_by_customer: true,
          customer_confirmed_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Save failed.'); return; }
      setConfirmed(true);
      onUpdated();
    } catch { setErr('Network error — try again.'); }
    finally { setSaving(false); }
  }

  if (confirmed) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: '0 0 4px' }}>Confirmed.</p>
        <p style={{ fontSize: 13, color: '#4b7c5e', margin: 0 }}>See you {day}{time}.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '2px solid #3b82f6', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', margin: '0 0 6px' }}>
        {`We'd like to pick up on ${day}${time}. Does that work?`}
      </p>
      {err && <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 10px' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          style={{ flex: 1, padding: '11px 14px', background: saving ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}
        >
          {saving ? 'Saving...' : "Confirm — I'll be there"}
        </button>
        <button
          type="button"
          onClick={onOpenMessages}
          style={{ flex: 1, padding: '11px 14px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Request different time
        </button>
      </div>
    </div>
  );
}

function DeliveryConfirmSection({ booking, bookingId, onUpdated }) {
  // phase: 'select' | 'map' | 'daytime' | 'confirmed'
  const [phase, setPhase] = useState(booking.delivery_address ? 'confirmed' : 'select');
  const [savedAddress, setSavedAddress] = useState(booking.delivery_address || '');
  const [pin, setPin] = useState(null);
  const [pinAddress, setPinAddress] = useState('');
  const [pinOutside, setPinOutside] = useState(false);
  const [addrQuery, setAddrQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [deliveryDay, setDeliveryDay] = useState(booking.delivery_preferred_day || '');
  const [deliveryTime, setDeliveryTime] = useState(booking.delivery_preferred_time || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const { noun, verb, them } = itemNoun(booking);
  const inp = { width: '100%', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };

  async function apiSave(fields) {
    const res = await fetch('/api/bookings/' + bookingId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Save failed.');
    }
  }

  async function handleSameSpot() {
    const addr = (booking.address || '').trim();
    if (!addr) { setErr('No pickup address on file — use Different location instead.'); return; }
    setSaving(true); setErr('');
    try {
      await apiSave({ delivery_address: addr });
      setSavedAddress(addr);
      setPhase('daytime');
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function handleMapClick(lat, lng) {
    const outside = !isInServiceArea(lat, lng);
    setPin({ lat, lng });
    setPinOutside(outside);
    setPinAddress('');
    if (outside) return;
    setSaving(true); setErr('');
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (service.oneloveoutdoors.org)' } }
      );
      const data = await geo.json();
      const addr = data.display_name
        ? data.display_name.split(',').slice(0, 3).join(',').trim()
        : `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
      setPinAddress(addr);
      await apiSave({ delivery_address: addr });
      setSavedAddress(addr);
      setPhase('daytime');
    } catch { setErr('Could not save location — try again.'); }
    finally { setSaving(false); }
  }

  async function searchAddr(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!addrQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' + encodeURIComponent(addrQuery),
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (service.oneloveoutdoors.org)' } }
      );
      const results = await res.json();
      if (results[0]) {
        await handleMapClick(parseFloat(results[0].lat), parseFloat(results[0].lon));
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function handleDayTimeConfirm() {
    setSaving(true); setErr('');
    try {
      await apiSave({
        delivery_preferred_day: deliveryDay || null,
        delivery_preferred_time: deliveryTime || null,
      });
      setPhase('confirmed');
      onUpdated();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (phase === 'confirmed') {
    const day  = booking.delivery_preferred_day  || deliveryDay;
    const time = booking.delivery_preferred_time || deliveryTime;
    const dayFmt  = day  ? fmtDate(day)  : '';
    const timeFmt = time ? fmtTime(time) : '';
    const when = dayFmt && timeFmt ? `${dayFmt} around ${timeFmt}` : dayFmt || '';
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: '0 0 4px' }}>Delivery details confirmed.</p>
        {when
          ? <p style={{ fontSize: 13, color: '#4b7c5e', margin: 0 }}>Delivery: {when}</p>
          : <p style={{ fontSize: 13, color: '#4b7c5e', margin: 0 }}>Got it. We'll confirm the exact time.</p>
        }
      </div>
    );
  }

  if (phase === 'select') {
    return (
      <div style={{ background: '#fff', border: '2px solid #0ea5e9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', margin: '0 0 14px' }}>
          {`Your ${noun} ${verb} ready. Where should we bring ${them}?`}
        </p>
        {err && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#dc2626' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleSameSpot}
            disabled={saving}
            style={{ flex: 1, padding: '12px 10px', borderRadius: 8, fontSize: 14, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 400, textAlign: 'center' }}
          >
            {saving ? 'Saving...' : <><strong style={{ display: 'block' }}>Same spot</strong><span style={{ fontSize: 12, color: '#6b7280' }}>{booking.address || 'Pickup address'}</span></>}
          </button>
          <button
            type="button"
            onClick={() => { setPhase('map'); setErr(''); }}
            disabled={saving}
            style={{ flex: 1, padding: '12px 10px', borderRadius: 8, fontSize: 14, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 400 }}
          >
            Different location
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'map') {
    return (
      <div style={{ background: '#fff', border: '2px solid #0ea5e9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>Where should we meet?</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Home, office, trailhead — wherever works.</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            type="text"
            value={addrQuery}
            onChange={e => setAddrQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchAddr(e); } }}
            placeholder="Search an address..."
            style={{ ...inp, flex: 1 }}
          />
          <button
            type="button"
            onClick={searchAddr}
            disabled={searching || saving}
            style={{ padding: '8px 14px', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            {searching ? '...' : 'Find'}
          </button>
        </div>
        <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 6 }}>
          <ServiceMap pin={pin} onMapClick={handleMapClick} showBoundary />
        </div>
        {saving && <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Saving location...</p>}
        {!pin && !saving && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Search above or tap the map to drop a pin.</p>}
        {pin && pinOutside && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginTop: 6 }}>
            <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, margin: '0 0 2px' }}>{"That's outside our range."}</p>
            <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>
              <a href="mailto:service@oneloveoutdoors.org" style={{ color: '#dc2626' }}>Reach out</a> and we'll figure something out.
            </p>
          </div>
        )}
        {err && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#dc2626' }}>{err}</p>}
        <button
          type="button"
          onClick={() => { setPhase('select'); setPin(null); setPinAddress(''); setPinOutside(false); setErr(''); }}
          style={{ marginTop: 10, background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          Back
        </button>
      </div>
    );
  }

  // phase === 'daytime'
  return (
    <div style={{ background: '#fff', border: '2px solid #0ea5e9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>Almost done.</p>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>Delivering to: {savedAddress}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lbl}>Preferred day</label>
          <select value={deliveryDay} onChange={e => setDeliveryDay(e.target.value)} style={{ ...inp, color: deliveryDay ? '#111827' : '#9ca3af' }}>
            <option value="">No preference</option>
            {DELIVERY_DATE_OPTIONS.map(opt => (
              <option key={opt.date} value={opt.date}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Preferred time</label>
          <input type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} style={{ ...inp, color: deliveryTime ? '#111827' : '#9ca3af' }} />
        </div>
      </div>
      {err && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#dc2626' }}>{err}</p>}
      <button
        type="button"
        onClick={handleDayTimeConfirm}
        disabled={saving}
        style={{ width: '100%', padding: '10px 0', background: saving ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}
      >
        {saving ? 'Saving...' : 'Confirm delivery'}
      </button>
    </div>
  );
}

function CancelSection({ booking, bookingId, onUpdated, onOpenMessages }) {
  const [step, setStep] = useState('link'); // 'link' | 'confirm' | 'done'
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  if (step === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Cancelled. No worries — book again anytime.</p>
        <a href="/schedule-service" style={{ fontSize: 14, color: '#1a3328', textDecoration: 'underline' }}>Book a new service →</a>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f1a14', margin: '0 0 4px' }}>Are you sure?</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>We can also reschedule if that works better.</p>
        {err && <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 10px' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              setSaving(true); setErr('');
              try {
                const res = await fetch('/api/bookings/' + bookingId, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'cancelled' }),
                });
                if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Failed. Try again.'); return; }
                setStep('done');
                onUpdated();
              } catch { setErr('Network error — try again.'); }
              finally { setSaving(false); }
            }}
            disabled={saving}
            style={{ flex: 1, padding: '10px 14px', background: saving ? '#9ca3af' : '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Cancelling...' : 'Cancel booking'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('link'); onOpenMessages(); }}
            style={{ flex: 1, padding: '10px 14px', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Message us to reschedule
          </button>
        </div>
        <button
          type="button"
          onClick={() => setStep('link')}
          style={{ marginTop: 10, background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          Nevermind
        </button>
      </div>
    );
  }

  // step === 'link'
  return (
    <p style={{ fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
      <button
        type="button"
        onClick={() => setStep('confirm')}
        style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
      >
        Need to cancel?
      </button>
    </p>
  );
}

function UpdateInfoSection({ booking, bookingId, onUpdated }) {
  const locked = !EDITABLE_STATUSES.has(booking.status);
  const [name, setName] = useState(booking.name || '');
  const [phone, setPhone] = useState(booking.phone || '');
  const [email, setEmail] = useState(booking.email || '');
  const [address, setAddress] = useState(booking.address || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { setErr('Name and phone are required.'); return; }
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/bookings/' + bookingId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Save failed.'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdated();
    } catch { setErr('Network error — try again.'); }
    finally { setSaving(false); }
  }

  const inputStyle = {
    width: '100%', padding: '8px 11px', border: '1px solid #d1d5db',
    borderRadius: 7, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: locked ? '#9ca3af' : '#111827',
    background: locked ? '#f9fafb' : '#fff',
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 14px' }}>
        {locked ? 'Your info is locked once we have your bike.' : 'Missing something? Update your info here.'}
      </p>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} disabled={locked} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} disabled={locked} type="tel" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} disabled={locked} type="email" placeholder={locked ? '' : 'Add one to get email updates'} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} disabled={locked} style={inputStyle} />
        </div>
        {err && <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{err}</p>}
        {!locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '8px 22px', background: saving ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saved && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Updated</span>}
          </div>
        )}
      </form>
    </div>
  );
}

export default function BookingStatusPage({ params }) {
  const { id } = params;
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [inspBikeIdx, setInspBikeIdx] = useState(0);
  const threadRef = useRef(null);
  const threadMountedRef = useRef(false);
  const intervalRef = useRef(null);

  async function loadData() {
    try {
      const [bRes, mRes, iRes] = await Promise.all([
        fetch('/api/bookings/' + id),
        fetch('/api/messages?booking_id=' + id),
        fetch('/api/inspections/' + id),
      ]);
      if (!bRes.ok) { setNotFound(true); setLoading(false); return; }
      const bData = await bRes.json();
      const mData = await mRes.json();
      const iData = iRes.ok ? await iRes.json() : {};
      const b = bData.booking || bData;
      console.log('[service/[id]] booking status:', b.status, '| invoice_amount:', b.invoice_amount, '| payment_link:', b.payment_link);
      setBooking(b);
      setMessages(mData.messages || []);
      // Merge all bike reports into one view — pick the report with most data, or combine
      const reports = iData.reports || (iData.report ? [iData.report] : []);
      setReport(reports.length > 0 ? reports : null);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 10000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  useEffect(() => {
    if (!threadMountedRef.current) { threadMountedRef.current = true; return; }
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!msgText.trim() || sending) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, sender: 'customer', message: msgText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendErr(err.error || 'Failed to send. Try again.');
        return;
      }
      setMsgText('');
      await loadData();
    } catch {
      setSendErr('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafaf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9ca3af' }}>Loading...</div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafaf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: 18 }}>Booking not found.</p>
          <a href="/schedule-service" style={{ color: '#1a3328', fontSize: 14 }}>Book a service</a>
        </div>
      </main>
    );
  }

  const displayStatus = booking.status === 'picked_up' ? 'in_progress' : booking.status;
  const currentStep = STATUS_STEPS.indexOf(displayStatus);
  const color = STATUS_COLOR[booking.status] || '#9ca3af';

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#0f1a14', fontStyle: 'italic' }}>
            {'One Love Outdoors'}
          </span>
        </a>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#0f1a14', marginBottom: 4 }}>
          {getStatusHeading(booking)}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
          {'Check back here for updates. You can message us below.'}
        </p>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 17 }}>{booking.name}</span>
            <span style={{
              background: color + '22', color, border: '1px solid ' + color + '55',
              borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600,
            }}>
              {STATUS_LABEL[booking.status] || booking.status}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {STATUS_STEPS.map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= currentStep ? color : '#e5e7eb',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {booking.is_member && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 10px' }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                {booking.member_verified ? 'One Love Member ✓' : 'One Love Member — free pickup & delivery'}
              </span>
            </div>
          )}

          {booking.confirmed_date && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                {'Pickup: '}
                {fmtDate(booking.confirmed_date)}
                {booking.confirmed_time && ' around ' + fmtTime(booking.confirmed_time)}
              </div>
            </div>
          )}
          {booking.return_date && !['out_for_delivery', 'complete', 'delivered'].includes(booking.status) && (
            <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                {'Estimated return: '}
                {fmtDate(booking.return_date)}
              </div>
            </div>
          )}
          {['out_for_delivery', 'complete', 'delivered'].includes(booking.status) && booking.return_date && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
                {booking.status === 'complete' || booking.status === 'delivered' ? 'Delivered: ' : 'Delivery: '}
                {fmtDate(booking.return_date)}
                {booking.delivery_time && ' around ' + fmtTime(booking.delivery_time)}
              </div>
            </div>
          )}

          <div style={{ fontSize: 14, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!booking.bikes?.length && booking.bike_brand && (
              <span><strong>Bike:</strong> {booking.bike_brand}</span>
            )}
            {!booking.bikes?.length && booking.issues && booking.issues.length > 0 && (
              <span><strong>Issues:</strong> {booking.issues.join(', ')}</span>
            )}
            {booking.address && (
              <span><strong>Pickup:</strong> {booking.address}</span>
            )}
          </div>

          {booking.bikes?.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              {booking.bikes.map((bike, i) => (
                <div key={i} style={{ marginBottom: i < booking.bikes.length - 1 ? 8 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {'Bike ' + (i + 1) + (bike.name ? ' — ' + bike.name : '') + (bike.brand ? ' (' + bike.brand + ')' : '')}
                  </div>
                  {(bike.issues || []).length > 0 && (
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 1 }}>
                      {(bike.issues || []).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {booking.status === 'confirmed' && booking.confirmed_date && (
          <PickupConfirmSection
            booking={booking}
            bookingId={id}
            onUpdated={loadData}
            onOpenMessages={() => {
              document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' });
              document.getElementById('message-input')?.focus();
            }}
          />
        )}

        <UpdateInfoSection booking={booking} bookingId={id} onUpdated={loadData} />

        {booking.status === 'ready' && (
          <DeliveryConfirmSection booking={booking} bookingId={id} onUpdated={loadData} />
        )}

        {/* From the shop — photos */}
        {booking.shop_photos && booking.shop_photos.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              From the shop
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {booking.shop_photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                  <img
                    src={url}
                    alt={'Shop photo ' + (i + 1)}
                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb', display: 'block' }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Inspection Report */}
        {Array.isArray(report) && report.some(r => r.items?.some(it => !it.na && (it.state || it.wear != null || it.note))) && (() => {
          const showTabs = (booking.bikes?.length || 0) > 1;
          const activeReport = showTabs
            ? (report.find(r => r.bike_index === inspBikeIdx) || null)
            : (report[0] || null);
          const wearItems   = (activeReport?.items || []).filter(it => !it.na && it.wear != null);
          const replaced    = (activeReport?.items || []).filter(it => !it.na && it.state === 'replaced');
          const done        = (activeReport?.items || []).filter(it => !it.na && it.state === 'done');
          const sentOut     = (activeReport?.items || []).filter(it => !it.na && it.state === 'sent_out');
          const attention   = (activeReport?.items || []).filter(it => !it.na && it.state === 'attention');
          const adjusted    = (activeReport?.items || []).filter(it => !it.na && it.state === 'adjusted');
          const good        = (activeReport?.items || []).filter(it => !it.na && it.state === 'good');
          const noteValues  = (activeReport?.items || []).filter(it => !it.na && !('state' in it) && !('wear' in it) && it.note);
          const notes       = activeReport?.notes;
          const hasData     = wearItems.length || replaced.length || done.length || sentOut.length || attention.length || adjusted.length || good.length || noteValues.length || notes;
          return (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Inspection Report
                </p>
                <a
                  href={'/api/inspection-pdf/' + booking.id}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: '#1a3328', textDecoration: 'underline' }}
                >
                  Download report
                </a>
              </div>

              {showTabs && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {booking.bikes.map((bike, i) => {
                    const hasReport = report.some(r => r.bike_index === i && r.items?.some(it => it.state || it.wear != null));
                    const label = bike.name || bike.brand || ('Bike ' + (i + 1));
                    const active = inspBikeIdx === i;
                    return (
                      <button key={i} type="button" onClick={() => setInspBikeIdx(i)}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                          border: '1px solid ' + (active ? '#1a3328' : '#e5e7eb'),
                          background: active ? '#1a3328' : '#fff',
                          color: active ? '#fff' : (hasReport ? '#374151' : '#9ca3af'),
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {'Bike ' + (i + 1) + ': ' + label}
                        {!hasReport && <span style={{ fontSize: 10, marginLeft: 4 }}>Pending</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {hasData ? (
                <>
                  {wearItems.length > 0 && (
                    <div style={{ marginBottom: replaced.length || attention.length || adjusted.length || good.length ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Component Wear
                      </div>
                      {wearItems.map((item, i) => {
                        const pct = item.wear;
                        const wearColor = item.replaced ? '#16a34a' : (pct >= 75 ? '#16a34a' : pct >= 50 ? '#ca8a04' : pct >= 25 ? '#ea580c' : '#dc2626');
                        const wearLabel = item.replaced ? 'Replaced ✓' : pct === 100 ? 'new' : pct === 75 ? 'good' : pct === 50 ? 'halfway — plan to replace next service' : pct === 25 ? 'replace soon' : 'replace now';
                        return (
                          <div key={i} style={{ marginBottom: i < wearItems.length - 1 ? 10 : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.label}</span>
                              <span style={{ fontSize: 12, color: wearColor, fontWeight: 600 }}>{item.replaced ? 'Replaced ✓' : pct + '%'}</span>
                            </div>
                            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: pct + '%', background: wearColor, borderRadius: 3 }} />
                            </div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{wearLabel}{item.note ? ' — ' + item.note : ''}</div>
                            {item.photo && (
                              <a href={item.photo} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                                <img src={item.photo} alt={item.label} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', display: 'block' }} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(replaced.length > 0 || done.length > 0) && (
                    <div style={{ marginBottom: sentOut.length || attention.length || adjusted.length || good.length ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Replaced / Done
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[...replaced, ...done].map((item, i) => (
                          <div key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{item.label} ✓</div>
                            {item.note && <div style={{ fontSize: 12, color: '#4b7c5e', marginTop: 2 }}>{item.note}</div>}
                            {item.photo && (
                              <a href={item.photo} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                                <img src={item.photo} alt={item.label} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #bbf7d0', display: 'block' }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sentOut.length > 0 && (
                    <div style={{ marginBottom: attention.length || adjusted.length || good.length ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Sent to Specialist
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sentOut.map((item, i) => (
                          <div key={i} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#6d28d9' }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 2 }}>Sent to specialist for service</div>
                            {item.note && <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 1 }}>{item.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {attention.length > 0 && (
                    <div style={{ marginBottom: adjusted.length || good.length ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Needs Attention
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {attention.map((item, i) => (
                          <div key={i} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{item.label}</div>
                            {item.note && <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>{item.note}</div>}
                            {item.photo && (
                              <a href={item.photo} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                                <img src={item.photo} alt={item.label} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #fed7aa', display: 'block' }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adjusted.length > 0 && (
                    <div style={{ marginBottom: good.length ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Adjusted
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {adjusted.map((item, i) => (
                          <div key={i} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>{item.label}</div>
                            {item.note && <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 2 }}>{item.note}</div>}
                            {item.photo && (
                              <a href={item.photo} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                                <img src={item.photo} alt={item.label} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #bfdbfe', display: 'block' }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {good.length > 0 && (
                    <div style={{ marginBottom: noteValues.length ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Good
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                        {good.map(it => it.label).join(', ')}
                      </p>
                    </div>
                  )}

                  {noteValues.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Recorded Values
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {noteValues.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                            <span style={{ color: '#6b7280', minWidth: 160 }}>{item.label}</span>
                            <span style={{ color: '#374151', fontWeight: 500 }}>{item.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notes && (
                    <p style={{ fontSize: 13, color: '#374151', margin: '16px 0 0', paddingTop: 14, borderTop: '1px solid #f3f4f6', lineHeight: 1.5 }}>
                      {notes}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Inspection pending for this bike.</p>
              )}
            </div>
          );
        })()}

        {/* Estimate section */}
        {booking.estimate_amount != null && !['complete', 'done', 'delivered'].includes(booking.status) && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estimated Cost
            </p>
            {booking.estimate_photo && (
              <a href={booking.estimate_photo} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 12 }}>
                <img
                  src={booking.estimate_photo}
                  alt="Estimate photo"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', display: 'block' }}
                />
              </a>
            )}
            <p style={{ fontSize: 20, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>
              Around ${Math.round(Number(booking.estimate_amount))}
            </p>
            {booking.estimate_notes && (
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5 }}>
                {booking.estimate_notes}
              </p>
            )}
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>
              This is a rough estimate based on what we know so far. If we find anything else once we&apos;re in there, we&apos;ll let you know before doing any additional work. No surprises.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Questions about this estimate? Message us below.
            </p>
          </div>
        )}

        {/* Payment section */}
        {['ready', 'out_for_delivery', 'complete', 'done', 'delivered'].includes(booking.status) && (booking.payment_status === 'paid' ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#166534', margin: 0 }}>Paid. Thanks!</p>
          </div>
        ) : (booking.invoice_amount != null || booking.payment_link) && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f1a14', marginBottom: 14, marginTop: 0 }}>
              {'Your total: $' + Number(booking.invoice_amount).toFixed(2)}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#0f1a14', margin: '0 0 4px' }}>
              Pay when we deliver
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 14px' }}>
              Cash or card at the door. Simple.
            </p>
            {booking.payment_link && (
              <a
                href={booking.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#6b7280', textDecoration: 'underline' }}
              >
                Need to pay ahead? Pay online →
              </a>
            )}
          </div>
        ))}

        {/* Message thread */}
        <div id="messages" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafaf7' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Got questions? We're here.</span>
          </div>

          <div ref={threadRef} style={{ padding: 16, minHeight: 120, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', margin: 'auto' }}>
                {'No messages yet. Ask us anything.'}
              </p>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'customer' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                  background: m.sender === 'customer' ? '#1a3328' : '#f3f4f6',
                  color: m.sender === 'customer' ? '#fff' : '#111827',
                  fontSize: 14, lineHeight: 1.4,
                }}>
                  {m.message}
                </div>
              </div>
            ))}
          </div>

          {sendErr && (
            <p style={{ margin: '0 12px', padding: '6px 10px', background: '#fef2f2', color: '#dc2626', fontSize: 13, borderRadius: 6 }}>
              {sendErr}
            </p>
          )}
          <form onSubmit={sendMessage} style={{ padding: 12, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
            <input
              id="message-input"
              type="text"
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1, padding: '9px 13px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 14, outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!msgText.trim() || sending}
              style={{
                padding: '9px 18px', background: msgText.trim() ? '#1a3328' : '#9ca3af',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: msgText.trim() ? 'pointer' : 'default',
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>

        {['new', 'confirmed'].includes(booking.status) && (
          <CancelSection booking={booking} bookingId={id} onUpdated={loadData} onOpenMessages={() => {
            document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' });
            document.getElementById('message-input')?.focus();
          }} />
        )}

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>
          {'Bookmark this page to check your status anytime.'}
        </p>
      </div>
    </main>
  );
}
