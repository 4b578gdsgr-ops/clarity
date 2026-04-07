'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { isInServiceArea } from '../../../../lib/serviceArea';

const ServiceMap = dynamic(() => import('../../../components/ServiceMap'), { ssr: false });

function getStatusHeading(booking) {
  const { status, confirmed_date, confirmed_time, return_date } = booking;
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
      return "Your bike is with us. Working on it.";
    case 'ready': {
      const ret = return_date ? fmtDate(return_date) : '';
      return ret
        ? `Your bike is dialed and ready to roll. We'll have it back to you ${ret}.`
        : "Your bike is dialed and ready to roll.";
    }
    case 'out_for_delivery':
      return "On our way to you now.";
    case 'complete':
    case 'done':
    case 'delivered':
      return "Delivered. You're golden.";
    default:
      return "We got you. We'll reach out shortly to set up a time.";
  }
}

const STATUS_LABEL = {
  new:             'Request received',
  confirmed:       'Confirmed',
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

function fmtTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';

const EDITABLE_STATUSES = new Set(['new', 'confirmed', 'in_progress', 'booked', 'picked_up']);

function DeliveryConfirmSection({ booking, bookingId, onUpdated }) {
  const already = !!booking.delivery_address;
  const [mode, setMode] = useState(already ? 'same' : null); // null | 'same' | 'different'
  const [pin, setPin] = useState(null);
  const [pinAddress, setPinAddress] = useState('');
  const [pinOutside, setPinOutside] = useState(false);
  const [addrQuery, setAddrQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [deliveryDay, setDeliveryDay] = useState(booking.delivery_preferred_day || '');
  const [deliveryTimeVal, setDeliveryTimeVal] = useState(booking.delivery_preferred_time || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(already);
  const [err, setErr] = useState('');

  const deliveryAddress = mode === 'same'
    ? (booking.delivery_address || booking.address || '')
    : pinAddress || (pin ? `${Number(pin.lat).toFixed(5)}, ${Number(pin.lng).toFixed(5)}` : '');

  function applyPin(lat, lng, resolved) {
    setPin({ lat, lng });
    setPinOutside(!isInServiceArea(lat, lng));
    setPinAddress(resolved || '');
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
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        applyPin(lat, lng, results[0].display_name.split(',').slice(0, 3).join(',').trim());
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function handleMapClick(lat, lng) {
    applyPin(lat, lng, '');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'LoveOverMoney/1.0 (service.oneloveoutdoors.org)' } }
      );
      const data = await res.json();
      if (data.display_name) setPinAddress(data.display_name.split(',').slice(0, 3).join(',').trim());
    } catch { /* ignore */ }
  }

  async function handleConfirm() {
    const addr = deliveryAddress.trim();
    if (!addr) { setErr('Please select a delivery location.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/bookings/' + bookingId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_address: addr,
          delivery_preferred_day: deliveryDay || null,
          delivery_preferred_time: deliveryTimeVal || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Save failed.'); return; }
      setSaved(true);
      onUpdated();
    } catch { setErr('Network error — try again.'); }
    finally { setSaving(false); }
  }

  const inp = { width: '100%', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };
  const showDayTime = mode === 'same' || (mode === 'different' && pin && !pinOutside);

  if (saved) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: '0 0 4px' }}>Delivery details confirmed.</p>
        <p style={{ fontSize: 13, color: '#4b7c5e', margin: 0 }}>Got it. We'll confirm the exact time.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '2px solid #0ea5e9', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', margin: '0 0 14px' }}>
        Your bike is ready. Where should we bring it?
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => { setMode('same'); setErr(''); }}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            border: mode === 'same' ? '2px solid #16a34a' : '1px solid #d1d5db',
            background: mode === 'same' ? '#f0fdf4' : '#fff',
            color: mode === 'same' ? '#166534' : '#374151',
            fontWeight: mode === 'same' ? 600 : 400,
          }}
        >
          Same spot
        </button>
        <button
          type="button"
          onClick={() => { setMode('different'); setErr(''); }}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            border: mode === 'different' ? '2px solid #1a3328' : '1px solid #d1d5db',
            background: mode === 'different' ? '#f8faf9' : '#fff',
            color: mode === 'different' ? '#1a3328' : '#374151',
            fontWeight: mode === 'different' ? 600 : 400,
          }}
        >
          Different location
        </button>
      </div>

      {mode === 'same' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: '#166534', fontWeight: 600, margin: 0 }}>
            ✓ {booking.address || 'Your original pickup address'}
          </p>
        </div>
      )}

      {mode === 'different' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f1a14', margin: '0 0 2px' }}>Where should we meet?</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px' }}>Home, office, trailhead — wherever works.</p>
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
              disabled={searching}
              style={{ padding: '8px 14px', background: '#1a3328', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
            >
              {searching ? '...' : 'Find'}
            </button>
          </div>
          <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 6 }}>
            <ServiceMap pin={pin} onMapClick={handleMapClick} showBoundary />
          </div>
          {!pin && (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Search above or tap the map to drop a pin.</p>
          )}
          {pin && pinOutside && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, margin: '0 0 2px' }}>{"That's outside our range."}</p>
              <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>
                <a href="mailto:service@oneloveoutdoors.org" style={{ color: '#dc2626' }}>Reach out</a> and we'll figure something out.
              </p>
            </div>
          )}
          {pin && !pinOutside && (
            <p style={{ fontSize: 13, color: '#166534', fontWeight: 500, margin: 0 }}>
              ✓ {pinAddress || 'Location set'}{' '}
              <button
                type="button"
                onClick={() => { setPin(null); setPinAddress(''); setPinOutside(false); }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              >
                clear
              </button>
            </p>
          )}
        </div>
      )}

      {showDayTime && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Preferred day</label>
              <select value={deliveryDay} onChange={e => setDeliveryDay(e.target.value)} style={{ ...inp, color: deliveryDay ? '#111827' : '#9ca3af' }}>
                <option value="">No preference</option>
                <option value="Monday">Monday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Preferred time</label>
              <input type="time" value={deliveryTimeVal} onChange={e => setDeliveryTimeVal(e.target.value)} style={{ ...inp, color: deliveryTimeVal ? '#111827' : '#9ca3af' }} />
            </div>
          </div>
          {err && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#dc2626' }}>{err}</p>}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            style={{ width: '100%', padding: '10px 0', background: saving ? '#9ca3af' : '#1a3328', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Saving...' : 'Confirm delivery'}
          </button>
        </>
      )}
    </div>
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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
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

export default function EmbedBookingStatusPage({ params }) {
  const { bookingId } = params;
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);

  async function loadData() {
    try {
      const [bRes, mRes, iRes] = await Promise.all([
        fetch('/api/bookings/' + bookingId),
        fetch('/api/messages?booking_id=' + bookingId),
        fetch('/api/inspections/' + bookingId),
      ]);
      if (!bRes.ok) { setNotFound(true); setLoading(false); return; }
      const bData = await bRes.json();
      const mData = await mRes.json();
      const iData = iRes.ok ? await iRes.json() : {};
      const b = bData.booking || bData;
      console.log('[embed/service] booking status:', b.status, '| invoice_amount:', b.invoice_amount, '| payment_link:', b.payment_link);
      setBooking(b);
      setMessages(mData.messages || []);
      setReport(iData.report || null);
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
  }, [bookingId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'lom-resize', height }, '*');
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        body: JSON.stringify({ booking_id: bookingId, sender: 'customer', message: msgText }),
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

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: 'transparent',
    padding: '16px',
    maxWidth: 560,
    margin: '0 auto',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', color: '#6b7280', padding: 32 }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>Booking not found.</p>
          <a
            href="/embed/service"
            style={{ color: '#1a3328', fontSize: 14 }}
          >
            Book a service
          </a>
        </div>
      </div>
    );
  }

  const displayStatus = booking.status === 'picked_up' ? 'in_progress' : booking.status;
  const currentStep = STATUS_STEPS.indexOf(displayStatus);
  const color = STATUS_COLOR[booking.status] || '#9ca3af';

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a202c', marginBottom: 4, marginTop: 0 }}>
        {getStatusHeading(booking)}
      </h2>
      <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>
        {'Check back here for updates. You can message us below.'}
      </p>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{booking.name}</span>
          <span style={{
            background: color + '22', color, border: '1px solid ' + color + '55',
            borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600,
          }}>
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
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
          {booking.bike_brand && (
            <span><strong>Bike:</strong> {booking.bike_brand}</span>
          )}
          {booking.issues && booking.issues.length > 0 && (
            <span><strong>Issues:</strong> {booking.issues.join(', ')}</span>
          )}
          {booking.address && (
            <span><strong>Pickup:</strong> {booking.address}</span>
          )}
        </div>
      </div>

      <UpdateInfoSection booking={booking} bookingId={bookingId} onUpdated={loadData} />

      {booking.status === 'ready' && (
        <DeliveryConfirmSection booking={booking} bookingId={bookingId} onUpdated={loadData} />
      )}

      {/* From the shop — photos */}
      {booking.shop_photos && booking.shop_photos.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
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
      {report && Array.isArray(report.items) && report.items.some(it => it.state) && (() => {
        const attention = report.items.filter(it => it.state === 'attention');
        const adjusted  = report.items.filter(it => it.state === 'adjusted');
        const good      = report.items.filter(it => it.state === 'good');
        return (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Inspection Report
            </p>

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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {good.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Good
                </div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                  {good.map(it => it.label).join(', ')}
                </p>
              </div>
            )}

            {report.notes && (
              <p style={{ fontSize: 13, color: '#374151', margin: '16px 0 0', paddingTop: 14, borderTop: '1px solid #f3f4f6', lineHeight: 1.5 }}>
                {report.notes}
              </p>
            )}
          </div>
        );
      })()}

      {/* Payment section */}
      {['ready', 'out_for_delivery', 'complete', 'done', 'delivered'].includes(booking.status) && (booking.invoice_amount != null || booking.payment_link) && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', marginBottom: 14, marginTop: 0 }}>
            {'Your total: $' + Number(booking.invoice_amount).toFixed(2)}
          </p>

          {booking.payment_link ? (
            <>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#166534', margin: '0 0 4px' }}>
                  Pay at delivery
                </p>
                <p style={{ fontSize: 12, color: '#4b7c5e', margin: 0 }}>
                  Cash or card. Easiest for everyone.
                </p>
              </div>
              <a
                href={booking.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', padding: '10px 0', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#374151', textDecoration: 'none', background: '#fafaf7' }}
              >
                Prefer to pay ahead? Pay online →
              </a>
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
              Pay at delivery — cash or card.
            </p>
          )}
        </div>
      )}

      {/* Message thread */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafaf7' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Got questions? We're here.</span>
        </div>

        <div style={{ padding: 16, minHeight: 100, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          <div ref={bottomRef} />
        </div>

        {sendErr && (
          <p style={{ margin: '0 12px', padding: '6px 10px', background: '#fef2f2', color: '#dc2626', fontSize: 13, borderRadius: 6 }}>
            {sendErr}
          </p>
        )}
        <form onSubmit={sendMessage} style={{ padding: 12, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: '9px 13px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!msgText.trim() || sending}
            style={{
              padding: '9px 18px',
              background: msgText.trim() ? '#1a3328' : '#9ca3af',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
              cursor: msgText.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        {'Bookmark this page to check your status anytime.'}
      </p>
    </div>
  );
}
