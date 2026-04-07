'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('../../components/RouteMap'), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────

const NEXT_ACTION = {
  new:             { label: 'Confirm',          next: 'confirmed'       },
  confirmed:       { label: 'In Progress',      next: 'in_progress'     },
  in_progress:     { label: 'Ready',            next: 'ready'           },
  ready:           { label: 'Out for Delivery', next: 'out_for_delivery' },
  out_for_delivery:{ label: 'Complete',         next: 'complete'        },
};

const STATUS_COLOR = {
  new:             '#f59e0b',
  confirmed:       '#3b82f6',
  picked_up:       '#8b5cf6',
  in_progress:     '#f97316',
  ready:           '#0ea5e9',
  out_for_delivery:'#2d8653',
  complete:        '#16a34a',
  done:            '#16a34a',
  cancelled:       '#9ca3af',
  booked:          '#f59e0b',
  delivered:       '#16a34a',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return 'the scheduled day';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function buildTemplate(newStatus, booking, pickupDate, time, returnDate) {
  const name = booking.name;
  const pickupWhen = (pickupDate ? fmtDate(pickupDate) : booking.preferred_day || 'the scheduled Monday') +
    (time ? ' around ' + fmtTime(time) : '');
  const returnWhen = returnDate ? fmtDate(returnDate) : 'Friday';
  const issues = booking.issues && booking.issues.length > 0
    ? booking.issues.join(', ').toLowerCase()
    : 'your bike';
  switch (newStatus) {
    case 'confirmed':
      return 'Hi ' + name + ', your pickup is confirmed for ' + pickupWhen + '. Plan on having it back by ' + returnWhen + '. We\'ll reach out when we\'re on the way. — One Love';
    case 'in_progress':
      return 'Hi ' + name + ', we\'ve got your bike and we\'re working on it. Plan on having it back by ' + returnWhen + '. We\'ll keep you posted. — One Love';
    case 'done':
      return 'Hi ' + name + ', your bike is ready! We\'ll deliver it on ' + returnWhen + '. — One Love';
    case 'ready':
      return 'Hi ' + name + ', your bike is ready! We\'ll deliver it on ' + returnWhen + '. We\'ll confirm an exact time closer to the day. — One Love';
    case 'out_for_delivery':
      return 'Hi ' + name + ', your bike is on its way back. See you today. — One Love';
    case 'complete':
      return 'Hi ' + name + ', delivered. Thanks for riding with us. — One Love';
    default:
      return '';
  }
}

function addMins(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return String(Math.floor(total / 60) % 24).padStart(2, '0') + ':' +
    String(total % 60).padStart(2, '0');
}

function nextServiceDay() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun,1=Mon
  const ahead = (1 - day + 7) % 7 || 7; // days until next Monday
  const d = new Date(today);
  d.setDate(today.getDate() + ahead);
  return d.toISOString().split('T')[0];
}

function pickupToReturn(pickupDateStr) {
  if (!pickupDateStr) return '';
  const [y, m, d] = pickupDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  const daysToFriday = (5 - dow + 7) % 7 || 7;
  date.setDate(date.getDate() + daysToFriday);
  return date.toISOString().split('T')[0];
}

function buildAppleMapsUrl(stops) {
  const pts = stops.filter(s => s.address || (s.lat && s.lng));
  if (!pts.length) return null;
  const daddrs = pts
    .map(s => s.address ? encodeURIComponent(s.address) : s.lat + ',' + s.lng)
    .map(v => '&daddr=' + v)
    .join('');
  return 'maps://?saddr=Current+Location' + daddrs;
}

function buildGoogleMapsUrl(stops) {
  const pts = stops.filter(s => s.address || (s.lat && s.lng));
  if (!pts.length) return null;
  const addrs = pts.map(s => s.address || s.lat + ',' + s.lng);
  if (addrs.length === 1) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(addrs[0]);
  }
  const dest = encodeURIComponent(addrs[addrs.length - 1]);
  const wp = addrs.slice(0, -1).map(a => encodeURIComponent(a)).join('|');
  return 'https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=' + dest + '&waypoints=' + wp;
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + ap;
}

// ─── MessageThread (per booking card) ────────────────────────────────────────

function MessageThread({ bookingId, onMarkRead }) {
  const [msgs, setMsgs] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    load();
    // Mark all customer messages for this booking as read
    fetch('/api/messages/unread', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    }).then(() => {
      if (onMarkRead) onMarkRead(bookingId);
    }).catch(() => {});
  }, [bookingId]);

  async function load() {
    setLoadErr('');
    try {
      const res = await fetch('/api/messages?booking_id=' + bookingId);
      const data = await res.json();
      if (!res.ok) {
        setLoadErr('Error loading messages: ' + (data.error || res.status));
        setMsgs([]);
        return;
      }
      setMsgs(data.messages || []);
    } catch (e) {
      setLoadErr('Network error loading messages');
      setMsgs([]);
    }
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, sender: 'admin', message: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendErr('Send failed: ' + (data.error || res.status));
        return;
      }
      setText('');
      await load();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      setSendErr('Network error — try again');
    } finally {
      setSending(false);
    }
  }

  if (msgs === null) return <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13 }}>Loading...</div>;

  const unread = (() => {
    const lastAdmin = [...msgs].reverse().find(m => m.sender === 'admin');
    return msgs.filter(m => m.sender === 'customer' &&
      (!lastAdmin || new Date(m.created_at) > new Date(lastAdmin.created_at))).length;
  })();

  return (
    <div style={{ borderTop: '1px solid #f3f4f6' }}>
      <div style={{
        maxHeight: 200, overflowY: 'auto', padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
        background: '#fafaf7',
      }}>
        {loadErr && (
          <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', margin: '4px 0', background: '#fef2f2', padding: '6px 10px', borderRadius: 6 }}>
            {loadErr}
          </p>
        )}
        {!loadErr && msgs.length === 0 && (
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', margin: '8px 0' }}>No messages yet.</p>
        )}
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '6px 10px', borderRadius: 10, fontSize: 13, lineHeight: 1.4,
              background: m.sender === 'admin' ? '#1a3328' : '#fff',
              color: m.sender === 'admin' ? '#fff' : '#111827',
              border: m.sender === 'customer' ? '1px solid #e5e7eb' : 'none',
            }}>
              {m.message}
              <div style={{ fontSize: 10, opacity: 0.45, marginTop: 3, textAlign: 'right' }}>
                {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {sendErr && (
        <div style={{ padding: '6px 14px', background: '#fef2f2', borderTop: '1px solid #fecaca' }}>
          <span style={{ fontSize: 12, color: '#dc2626' }}>{sendErr}</span>
        </div>
      )}
      <form onSubmit={send} style={{ display: 'flex', gap: 6, padding: '8px 14px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Reply..."
          style={{
            flex: 1, padding: '7px 11px', border: '1px solid #d1d5db',
            borderRadius: 7, fontSize: 13, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            padding: '7px 14px', background: text.trim() ? '#1a3328' : '#9ca3af',
            color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: text.trim() ? 'pointer' : 'default',
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

function pdFeeInfo(lat, lng) {
  if (!lat || !lng) return null;
  const R = 6371000;
  const φ1 = 41.7658 * Math.PI / 180;
  const φ2 = Number(lat) * Math.PI / 180;
  const Δφ = (Number(lat) - 41.7658) * Math.PI / 180;
  const Δλ = (Number(lng) - (-72.6734)) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const miles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) / 1609.34;
  const fee = miles < 10 ? 15 : miles < 20 ? 25 : 40;
  return { miles: miles.toFixed(1), fee };
}

async function geocodeAddress(address) {
  try {
    const res = await fetch(
      'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=' + encodeURIComponent(address),
      { headers: { 'User-Agent': 'LoveOverMoney/1.0 (service.oneloveoutdoors.org)' } }
    );
    const results = await res.json();
    if (results[0]) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }
  } catch { /* ignore */ }
  return null;
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({ booking, onRefresh, unreadCount = 0, onMarkRead }) {
  const [confirmDate, setConfirmDate] = useState(booking.confirmed_date || '');
  const [confirmTime, setConfirmTime] = useState(booking.confirmed_time || '');
  const [returnDate, setReturnDate] = useState(booking.return_date || (booking.confirmed_date ? pickupToReturn(booking.confirmed_date) : ''));
  const [deliveryTime, setDeliveryTime] = useState(booking.delivery_time || '');
  const [notes, setNotes] = useState(booking.notes || '');
  const [saving, setSaving] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMsgs, setShowMsgs] = useState(false);
  const [template, setTemplate] = useState('');
  const [copied, setCopied] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState(booking.invoice_amount != null ? String(booking.invoice_amount) : '');
  const [paymentLink, setPaymentLink] = useState(booking.payment_link || '');
  const [address, setAddress] = useState(booking.address || '');
  const [memberVerified, setMemberVerified] = useState(!!booking.member_verified);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const trackingUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org') + '/embed/service/' + booking.id;

  function buildTextMessage() {
    const name = booking.name.split(' ')[0];
    const link = trackingUrl;
    const st = booking.status;
    switch (st) {
      case 'confirmed': {
        const day = confirmDate ? fmtDate(confirmDate) : 'the scheduled day';
        const time = confirmTime ? ' around ' + fmtTime(confirmTime) : '';
        return 'Hi ' + name + ', your pickup is confirmed for ' + day + time + '. Track here: ' + link + ' — One Love';
      }
      case 'in_progress':
      case 'picked_up':
        return 'Hi ' + name + ', your bike is with us. We\'ll let you know when it\'s ready: ' + link + ' — One Love';
      case 'ready':
        return 'Hi ' + name + ', your bike is ready. Confirm delivery details here: ' + link + ' — One Love';
      case 'out_for_delivery':
        return 'Hi ' + name + ', we\'re on the way with your bike: ' + link + ' — One Love';
      case 'complete':
      case 'done':
      case 'delivered':
        return 'Hi ' + name + ', delivered. You\'re golden. — One Love';
      default:
        return 'Hi ' + name + ', your pickup is confirmed. Track here: ' + link + ' — One Love';
    }
  }

  function copyTracking() {
    navigator.clipboard.writeText(trackingUrl).catch(() => {});
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  async function copyTextMessage() {
    navigator.clipboard.writeText(buildTextMessage()).catch(() => {});
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    // Mark as manually texted so the NEEDS TEXT badge clears
    if (booking.contact_preference === 'text' || booking.contact_preference === 'phone') {
      await fetch('/api/bookings/' + booking.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_notified_status: booking.status }),
      });
      onRefresh();
    }
  }

  // Silent save — updates a field without triggering a full list refresh.
  // Use for field-level edits (date, time, notes) so native pickers aren't interrupted.
  async function save(fields) {
    setSaveErr('');
    const res = await fetch('/api/bookings/' + booking.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveErr(data.error || 'Save failed');
    }
  }

  // Full patch — saves and refreshes the list. Use for status changes and deletes.
  async function patch(fields) {
    await save(fields);
    onRefresh();
  }

  async function advance() {
    const action = NEXT_ACTION[booking.status];
    if (!action) return;
    if (action.next === 'confirmed' && !confirmDate) {
      alert('Set a pickup date before confirming.');
      return;
    }
    setAdvancing(true);
    await patch({
      status: action.next,
      confirmed_date: confirmDate || null,
      confirmed_time: confirmTime || null,
      return_date: returnDate || null,
      delivery_time: deliveryTime || null,
    });
    setTemplate(buildTemplate(action.next, booking, confirmDate, confirmTime, returnDate));
    setCopied(false);
    setAdvancing(false);
  }

  function copyTemplate() {
    navigator.clipboard.writeText(template).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function moveBack(newStatus) {
    await patch({ status: newStatus, last_notified_status: null, skip_notification: true });
  }

  async function handleDelete() {
    if (!window.confirm('Delete this booking?')) return;
    setDeleting(true);
    await fetch('/api/bookings/' + booking.id, { method: 'DELETE' });
    onRefresh();
  }

  const action = NEXT_ACTION[booking.status];
  const color = STATUS_COLOR[booking.status] || '#9ca3af';

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 14 }}>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{booking.name}</span>
            {booking.bike_brand && (
              <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>{booking.bike_brand}</span>
            )}
            {booking.contact_preference && (
              <span style={{
                marginLeft: 8,
                background: booking.contact_preference === 'text' ? '#dbeafe' : booking.contact_preference === 'phone' ? '#f3f4f6' : '#ede9fe',
                color: booking.contact_preference === 'text' ? '#1d4ed8' : booking.contact_preference === 'phone' ? '#374151' : '#6d28d9',
                border: '1px solid ' + (booking.contact_preference === 'text' ? '#bfdbfe' : booking.contact_preference === 'phone' ? '#d1d5db' : '#ddd6fe'),
                borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {booking.contact_preference === 'text' ? 'Text' : booking.contact_preference === 'phone' ? 'Phone' : 'Email'}
              </span>
            )}
            {(booking.contact_preference === 'text' || booking.contact_preference === 'phone') &&
             ['confirmed', 'ready'].includes(booking.status) && (
              booking.last_notified_status === booking.status ? (
                <span style={{
                  marginLeft: 8,
                  background: '#f3f4f6', color: '#9ca3af',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Texted ✓
                </span>
              ) : (
                <span style={{
                  marginLeft: 8,
                  background: '#fff7ed', color: '#c2410c',
                  border: '1px solid #fed7aa',
                  borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  animation: 'pulse 2s infinite',
                }}>
                  Needs text
                </span>
              )
            )}
            {booking.issues && booking.issues.includes('New bike assembly') && (
              <span style={{
                marginLeft: 8,
                background: '#fff7ed', color: '#c2410c',
                border: '1px solid #fed7aa',
                borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Quote needed
              </span>
            )}
            {booking.is_member && !memberVerified && (
              <button
                onClick={async () => { await save({ member_verified: true }); setMemberVerified(true); }}
                title="Click to confirm this person is actually a member"
                style={{
                  marginLeft: 8, cursor: 'pointer',
                  background: '#fef9c3', color: '#854d0e',
                  border: '1px solid #fde047',
                  borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  fontFamily: 'inherit',
                }}
              >
                Member — Verify ✓
              </button>
            )}
            {booking.is_member && memberVerified && (
              <span style={{
                marginLeft: 8,
                background: '#f0fdf4', color: '#166534',
                border: '1px solid #bbf7d0',
                borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Member ✓
              </span>
            )}
            {booking.status === 'ready' && !booking.delivery_address && (
              <span style={{
                marginLeft: 8,
                background: '#fff7ed', color: '#c2410c',
                border: '1px solid #fed7aa',
                borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Awaiting delivery details
              </span>
            )}
          </div>
          <span style={{
            background: color + '22', color, border: '1px solid ' + color + '55',
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            {booking.status}
          </span>
        </div>

        <div style={{ fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          {booking.phone && (
            <span>
              <strong>Phone: </strong>
              <a href={'tel:' + booking.phone} style={{ color: '#1a3328' }}>{booking.phone}</a>
            </span>
          )}
          {booking.email && (
            <span>
              <strong>Email: </strong>
              <a href={'mailto:' + booking.email} style={{ color: '#1a3328' }}>{booking.email}</a>
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ whiteSpace: 'nowrap' }}>Address:</strong>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onBlur={() => save({ address: address || null })}
              placeholder="Enter address"
              style={{ flex: 1, fontSize: 13, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 5, fontFamily: 'inherit', color: '#1a3328', background: '#fafafa', minWidth: 0 }}
            />
            {address && (
              <a
                href={'https://maps.apple.com/?q=' + encodeURIComponent(address)}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                map ↗
              </a>
            )}
          </div>
          {!booking.address && booking.lat && booking.lng && (
            <span>
              <strong>Pin: </strong>
              <a
                href={'https://maps.apple.com/?ll=' + booking.lat + ',' + booking.lng}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1a3328' }}
              >
                {Number(booking.lat).toFixed(5)}, {Number(booking.lng).toFixed(5)}
              </a>
            </span>
          )}
          {(() => {
            const info = pdFeeInfo(booking.lat, booking.lng);
            return (
              <span style={{ color: '#9ca3af' }}>
                {info ? `${info.miles} mi — suggested P/D fee: $${info.fee}` : 'Distance: unknown'}
              </span>
            );
          })()}
          {booking.preferred_day && (
            <span><strong>Prefers: </strong>{booking.preferred_day}{booking.time_slot ? ', ' + booking.time_slot : ''}</span>
          )}
          {booking.confirmed_date && (
            <span><strong>Pickup: </strong>{fmtDate(booking.confirmed_date)}{booking.confirmed_time ? ' at ' + fmtTime(booking.confirmed_time) : ''}</span>
          )}
          {(booking.return_date || booking.confirmed_date) && (
            <span>
              <strong>Est. return: </strong>
              {fmtDate(booking.return_date || pickupToReturn(booking.confirmed_date))}
            </span>
          )}
          {booking.delivery_address && (
            <span style={{ color: '#0369a1' }}>
              <strong>Delivery to: </strong>{booking.delivery_address}
              {booking.delivery_preferred_day && ' — ' + booking.delivery_preferred_day}
              {booking.delivery_preferred_time && ' around ' + fmtTime(booking.delivery_preferred_time)}
            </span>
          )}
        </div>

        {booking.issues && booking.issues.length > 0 && (
          <div style={{ marginBottom: booking.bike_details ? 4 : 10 }}>
            {booking.issues.map(i => (
              <span key={i} style={{
                display: 'inline-block', marginRight: 5, marginBottom: 4,
                background: '#f3f4f6', borderRadius: 12, padding: '2px 9px', fontSize: 12,
              }}>
                {i}
              </span>
            ))}
          </div>
        )}
        {booking.bike_details && (
          <div style={{ marginBottom: 10, fontSize: 13, color: '#374151' }}>
            <strong>Bike details: </strong>{booking.bike_details}
          </div>
        )}

        {/* Photos */}
        {booking.photos && booking.photos.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Photos ({booking.photos.length})
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {booking.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                  <img
                    src={url}
                    alt={'Photo ' + (i + 1)}
                    style={{
                      width: 80, height: 80, objectFit: 'cover', borderRadius: 8,
                      border: '1px solid #e5e7eb', display: 'block',
                      cursor: 'pointer', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.8'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Invoice + Payment */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Invoice amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={invoiceAmount}
              onChange={e => setInvoiceAmount(e.target.value)}
              onBlur={() => {
                const val = invoiceAmount === '' ? null : parseFloat(invoiceAmount);
                if (val !== booking.invoice_amount) {
                  setSaving('invoice');
                  save({ invoice_amount: val }).then(() => setSaving(''));
                }
              }}
              style={{
                width: 100, padding: '6px 9px', border: '1px solid #e5e7eb',
                borderRadius: 6, fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Payment link</label>
            <input
              type="url"
              placeholder="https://square.link/..."
              value={paymentLink}
              onChange={e => setPaymentLink(e.target.value)}
              onBlur={() => {
                const val = paymentLink.trim() || null;
                if (val !== (booking.payment_link || null)) {
                  setSaving('payment');
                  save({ payment_link: val }).then(() => setSaving(''));
                }
              }}
              style={{
                width: '100%', padding: '6px 9px', border: '1px solid #e5e7eb',
                borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 14 }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== booking.notes) {
                setSaving('notes');
                save({ notes }).then(() => setSaving(''));
              }
            }}
            placeholder="Notes..."
            rows={2}
            style={{
              width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb',
              borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', lineHeight: 1.4, color: '#374151',
            }}
          />
        </div>

        {/* Pickup date + time */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Pickup date</label>
            <input
              type="date"
              value={confirmDate}
              onChange={e => {
                const val = e.target.value;
                setConfirmDate(val);
                const currentAutoReturn = pickupToReturn(confirmDate);
                if (val && (!returnDate || returnDate === currentAutoReturn)) {
                  const suggested = pickupToReturn(val);
                  setReturnDate(suggested);
                  setSaving('date');
                  save({ confirmed_date: val || null, return_date: suggested || null }).then(() => setSaving(''));
                } else {
                  setSaving('date');
                  save({ confirmed_date: val || null }).then(() => setSaving(''));
                }
              }}
              style={{
                padding: '6px 9px', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer',
                border: '1px solid ' + (confirmDate ? '#16a34a' : '#d1d5db'),
                color: confirmDate ? '#166534' : '#374151',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Time</label>
            <input
              type="time"
              value={confirmTime}
              onChange={e => {
                const val = e.target.value;
                setConfirmTime(val);
                setSaving('time');
                save({ confirmed_time: val || null }).then(() => setSaving(''));
              }}
              style={{
                padding: '6px 9px', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer',
                border: '1px solid ' + (confirmTime ? '#16a34a' : '#d1d5db'),
                color: confirmTime ? '#166534' : '#374151',
              }}
            />
          </div>
          {saving && <span style={{ fontSize: 12, color: '#9ca3af', paddingBottom: 6 }}>Saving...</span>}
          {saveErr && <span style={{ fontSize: 12, color: '#dc2626', paddingBottom: 6 }}>{saveErr}</span>}
        </div>

        {/* Est. return + Delivery time */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
              Est. return
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={e => {
                const val = e.target.value;
                setReturnDate(val);
                setSaving('return');
                save({ return_date: val || null }).then(() => setSaving(''));
              }}
              style={{
                padding: '6px 9px', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer',
                border: '1px solid ' + (returnDate
                  ? (returnDate !== pickupToReturn(confirmDate) ? '#f59e0b' : '#16a34a')
                  : '#d1d5db'),
                color: returnDate
                  ? (returnDate !== pickupToReturn(confirmDate) ? '#92400e' : '#166534')
                  : '#374151',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Delivery time</label>
            <input
              type="time"
              value={deliveryTime}
              onChange={e => {
                const val = e.target.value;
                setDeliveryTime(val);
                setSaving('delivery');
                save({ delivery_time: val || null }).then(() => setSaving(''));
              }}
              style={{
                padding: '6px 9px', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer',
                border: '1px solid ' + (deliveryTime ? '#2d8653' : '#d1d5db'),
                color: deliveryTime ? '#166534' : '#374151',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {action && (
            <button
              onClick={advance}
              disabled={advancing}
              style={{
                padding: '7px 16px', background: '#1a3328', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              }}
            >
              {advancing ? '...' : action.label}
            </button>
          )}
          {(() => {
            const STEPS = ['new', 'confirmed', 'in_progress', 'ready', 'out_for_delivery', 'complete'];
            const BACK_LABELS = { new: 'New', confirmed: 'Confirmed', in_progress: 'In Progress', ready: 'Ready', out_for_delivery: 'Out for Delivery', complete: 'Complete' };
            const idx = STEPS.indexOf(booking.status);
            if (idx <= 0) return null;
            return (
              <select
                value=""
                onChange={e => { if (e.target.value) moveBack(e.target.value); }}
                style={{
                  padding: '7px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: '1px solid #d1d5db', background: '#fff', color: '#6b7280',
                  outline: 'none',
                }}
              >
                <option value="">← Back</option>
                {STEPS.slice(0, idx).reverse().map(s => (
                  <option key={s} value={s}>{BACK_LABELS[s]}</option>
                ))}
              </select>
            );
          })()}
          <button
            onClick={() => setShowMsgs(!showMsgs)}
            style={{
              padding: '7px 14px', background: unreadCount > 0 && !showMsgs ? '#fef2f2' : '#f3f4f6',
              color: '#374151', border: unreadCount > 0 && !showMsgs ? '1px solid #fca5a5' : '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 13, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {showMsgs ? 'Hide messages' : 'Messages'}
            {unreadCount > 0 && !showMsgs && (
              <span style={{
                background: '#dc2626', color: '#fff', borderRadius: 10,
                padding: '1px 6px', fontSize: 11, fontWeight: 700, lineHeight: 1.4,
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={copyTracking}
            style={{
              padding: '7px 13px', background: copiedTracking ? '#f0fdf4' : '#f3f4f6',
              border: '1px solid ' + (copiedTracking ? '#bbf7d0' : '#e5e7eb'),
              borderRadius: 8, fontSize: 13, cursor: 'pointer',
              color: copiedTracking ? '#166534' : '#374151',
            }}
          >
            {copiedTracking ? 'Link copied!' : 'Copy link'}
          </button>
          <button
            onClick={copyTextMessage}
            style={{
              padding: '7px 13px', background: copiedText ? '#f0fdf4' : '#f3f4f6',
              border: '1px solid ' + (copiedText ? '#bbf7d0' : '#e5e7eb'),
              borderRadius: 8, fontSize: 13, cursor: 'pointer',
              color: copiedText ? '#166534' : '#374151',
            }}
          >
            {copiedText ? 'Text copied!' : 'Copy text'}
          </button>
          <a
            href={'/service/' + booking.id}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: '#6b7280', textDecoration: 'underline' }}
          >
            Customer view
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              marginLeft: 'auto', padding: '5px 12px', background: 'none',
              border: '1px solid #fca5a5', borderRadius: 7, fontSize: 12,
              color: '#dc2626', cursor: 'pointer',
            }}
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      {template && (
        <div style={{ margin: '0 18px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {'Message to send via ' + (booking.contact_preference || 'text/email') + ':'}
          </p>
          <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.5, marginBottom: 10, fontFamily: 'inherit' }}>
            {template}
          </p>
          <button
            onClick={copyTemplate}
            style={{ padding: '6px 16px', background: copied ? '#16a34a' : '#276749', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
          >
            {copied ? 'Copied!' : 'Copy message'}
          </button>
        </div>
      )}

      {/* Notification log */}
      {(() => {
        const last = booking.last_notified_status;
        const pref = booking.contact_preference;
        const LABEL = { new: 'Booking received', confirmed: 'Confirmed', ready: 'Ready' };
        const NEEDS_TEXT = new Set(['confirmed', 'ready']);

        if (last) {
          const label = LABEL[last] || last;
          const via = (pref === 'text' || pref === 'phone') ? '— texted ✓' : 'via email ✓';
          return (
            <div style={{ padding: '6px 18px 10px', fontSize: 12, color: '#9ca3af' }}>
              {'Notified: ' + label + ' ' + via}
            </div>
          );
        }
        if ((pref === 'text' || pref === 'phone') && NEEDS_TEXT.has(booking.status)) {
          const label = LABEL[booking.status] || booking.status;
          return (
            <div style={{ padding: '6px 18px 10px', fontSize: 12, color: '#ea580c', fontWeight: 500 }}>
              {'Notified: ' + label + ' — needs text'}
            </div>
          );
        }
        return null;
      })()}

      {showMsgs && <MessageThread bookingId={booking.id} onMarkRead={onMarkRead} />}
    </div>
  );
}

// ─── Plan Route view ──────────────────────────────────────────────────────────

function PlanRouteView({ allBookings, onRefresh }) {
  const [date, setDate] = useState(nextServiceDay());
  const [startTime, setStartTime] = useState('09:00');
  const [stops, setStops] = useState([]);
  const [times, setTimes] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const dragIndex = useRef(null);

  useEffect(() => {
    const pickups = allBookings
      .filter(b => b.confirmed_date === date && ['new', 'confirmed'].includes(b.status))
      .map(b => ({ ...b, _stopType: 'pickup' }));
    const deliveries = allBookings
      .filter(b => b.return_date === date && ['ready', 'out_for_delivery'].includes(b.status))
      .map(b => ({ ...b, _stopType: 'delivery' }));
    const dayBookings = [...pickups, ...deliveries];
    setStops(dayBookings);
    setTimes(autoTimes(dayBookings, startTime));
    setConfirmed(false);
  }, [date, allBookings]);

  useEffect(() => {
    setTimes(autoTimes(stops, startTime));
  }, [startTime]);

  function autoTimes(list, start) {
    const t = {};
    list.forEach((s, i) => { t[s.id] = addMins(start, i * 30); });
    return t;
  }

  function reorder(from, to) {
    const next = [...stops];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setStops(next);
    setTimes(autoTimes(next, startTime));
  }

  function changeDate(delta) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  }

  async function confirmRoute() {
    if (!stops.length) return;
    setConfirming(true);
    await Promise.all(stops.map(s => {
      const isDelivery = s._stopType === 'delivery';
      return fetch('/api/bookings/' + s.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isDelivery ? {
          delivery_time: times[s.id] || null,
        } : {
          status: s.status === 'new' ? 'confirmed' : s.status,
          confirmed_date: date,
          confirmed_time: times[s.id] || null,
        }),
      });
    }));
    setConfirming(false);
    setConfirmed(true);
    onRefresh();
  }

  const appleUrl = buildAppleMapsUrl(stops);
  const googleUrl = buildGoogleMapsUrl(stops);

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => changeDate(-1)}
          style={{ padding: '7px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
        >
          {'<'}
        </button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{dateLabel}</span>
        <button
          onClick={() => changeDate(1)}
          style={{ padding: '7px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
        >
          {'>'}
        </button>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label style={{ fontSize: 13, color: '#6b7280' }}>Start:</label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
        </div>
      </div>

      {/* Map */}
      {stops.length > 0 ? (
        <div style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 16 }}>
          <RouteMap stops={stops} />
        </div>
      ) : (
        <div style={{ height: 120, borderRadius: 12, border: '1px dashed #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            {'No pickups or deliveries for ' + date}
          </p>
        </div>
      )}

      {/* Stops list */}
      {stops.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Drag to reorder stops</div>
          {stops.map((stop, i) => (
            <div
              key={stop.id}
              draggable
              onDragStart={() => { dragIndex.current = i; }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragIndex.current !== null && dragIndex.current !== i) reorder(dragIndex.current, i); dragIndex.current = null; }}
              style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                padding: '12px 14px', marginBottom: 8, cursor: 'grab',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 28, height: 28,
                background: stop._stopType === 'delivery' ? '#2563eb' : '#16a34a',
                color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: stop._stopType === 'delivery' ? '#2563eb' : '#16a34a',
                    marginRight: 6,
                  }}>
                    {stop._stopType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
                  </span>
                  {stop.name}
                </div>
                {stop.address && <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.address}</div>}
                {stop.issues && stop.issues.length > 0 && (
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{stop.issues.join(', ')}</div>
                )}
              </div>
              <input
                type="time"
                value={times[stop.id] || ''}
                onChange={e => setTimes(t => ({ ...t, [stop.id]: e.target.value }))}
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6,
                  fontSize: 13, outline: 'none', flexShrink: 0, cursor: 'text',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {stops.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <button
            onClick={confirmRoute}
            disabled={confirming}
            style={{
              padding: '10px 22px', background: confirming ? '#9ca3af' : '#1a3328',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, cursor: confirming ? 'default' : 'pointer',
              fontWeight: 600,
            }}
          >
            {confirming ? 'Saving...' : confirmed ? 'Confirmed!' : 'Confirm Route'}
          </button>
          {appleUrl && (
            <a
              href={appleUrl}
              style={{
                padding: '10px 18px', background: '#f3f4f6', color: '#1a3328',
                border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14,
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              Open in Apple Maps
            </a>
          )}
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '10px 18px', background: '#fff', color: '#374151',
                border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Open in Google Maps
            </a>
          )}
        </div>
      )}

      {confirmed && (
        <p style={{ fontSize: 14, color: '#16a34a', fontWeight: 500, marginTop: 8 }}>
          Route confirmed. Times saved. iCal feed updated.
        </p>
      )}
    </div>
  );
}

// ─── All Requests view ────────────────────────────────────────────────────────

function AllRequestsView({ bookings, onRefresh, unreadCounts = {}, onMarkRead }) {
  const [filter, setFilter] = useState('new');

  const FILTERS = [
    { key: 'new',             label: 'New'             },
    { key: 'confirmed',       label: 'Confirmed'       },
    { key: 'in_progress',     label: 'In Progress'     },
    { key: 'ready',           label: 'Ready'           },
    { key: 'out_for_delivery',label: 'Out for Delivery'},
    { key: 'complete',        label: 'Complete'        },
    { key: 'all',             label: 'All'             },
  ];

  const counts = {};
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] || 0) + 1;
  }

  // picked_up is legacy — show under in_progress tab
  const filtered = filter === 'all'
    ? bookings
    : filter === 'in_progress'
      ? bookings.filter(b => b.status === 'in_progress' || b.status === 'picked_up')
      : bookings.filter(b => b.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.key === 'all' ? bookings.length
            : f.key === 'in_progress' ? (counts['in_progress'] || 0) + (counts['picked_up'] || 0)
            : (counts[f.key] || 0);
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: active ? '2px solid #1a3328' : '1px solid #d1d5db',
                background: active ? '#1a3328' : '#fff',
                color: active ? '#fff' : '#374151',
                fontWeight: active ? 600 : 400,
              }}
            >
              {f.label}{count > 0 ? ' (' + count + ')' : ''}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>
          {filter === 'all' ? 'No bookings yet.' : 'No ' + filter + ' bookings.'}
        </p>
      )}

      {filtered.map(b => (
        <BookingCard key={b.id} booking={b} onRefresh={onRefresh} unreadCount={unreadCounts[b.id] || 0} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}

// ─── Member Messages ──────────────────────────────────────────────────────────

function MemberThread({ thread, onRefresh, onMarkRead }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [deleting, setDeleting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (expanded && thread.unreadCount > 0) {
      fetch('/api/member-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: thread.thread_id, sender: 'member' }),
      }).then(() => onMarkRead(thread.thread_id)).catch(() => {});
    }
  }, [expanded]);

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [expanded, thread.messages.length]);

  async function sendReply(e) {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/member-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: thread.thread_id, message: replyText, sender: 'admin' }),
      });
      if (!res.ok) throw new Error();
      setReplyText('');
      onRefresh();
    } catch {
      setSendErr('Send failed — try again');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this entire thread? This cannot be undone.')) return;
    setDeleting(true);
    await fetch('/api/member-messages?thread_id=' + thread.thread_id, { method: 'DELETE' });
    onRefresh();
  }

  const lastMsg = thread.messages[thread.messages.length - 1];

  function fmtET(ts) {
    return new Date(ts).toLocaleString('en-US', {
      timeZone: 'America/New_York', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 10 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{thread.name || 'Member'}</span>
            {thread.unreadCount > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {thread.unreadCount}
              </span>
            )}
            {thread.email && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{thread.email}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lastMsg.sender === 'admin' ? '↩ ' : ''}{lastMsg.message}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtET(lastMsg.created_at)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
              style={{ padding: '3px 10px', background: 'none', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 11, color: '#dc2626', cursor: 'pointer' }}
            >
              {deleting ? '...' : 'Delete'}
            </button>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', background: '#fafaf7' }}>
            {thread.messages.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.4,
                  background: m.sender === 'admin' ? '#1a3328' : '#fff',
                  color: m.sender === 'admin' ? '#fff' : '#111827',
                  border: m.sender === 'member' ? '1px solid #e5e7eb' : 'none',
                }}>
                  {m.message}
                  <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, textAlign: 'right' }}>
                    {fmtET(m.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {thread.email && (
            <div style={{ padding: '4px 16px 2px', fontSize: 11, color: '#9ca3af', background: '#fff' }}>
              Reply will be emailed to {thread.email}
            </div>
          )}
          {!thread.email && (
            <div style={{ padding: '4px 16px 2px', fontSize: 11, color: '#f59e0b', background: '#fff' }}>
              No email on file — reply won't be sent
            </div>
          )}
          {sendErr && <div style={{ padding: '4px 16px', color: '#dc2626', fontSize: 12 }}>{sendErr}</div>}
          <form onSubmit={sendReply} style={{ display: 'flex', gap: 6, padding: '8px 14px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Reply..."
              style={{ flex: 1, padding: '7px 11px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none' }}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              style={{
                padding: '7px 14px', background: replyText.trim() ? '#1a3328' : '#9ca3af',
                color: '#fff', border: 'none', borderRadius: 7, fontSize: 13,
                cursor: replyText.trim() ? 'pointer' : 'default',
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MemberMessagesView({ messages, onRefresh, onMarkRead }) {
  const threadsMap = {};
  for (const msg of messages) {
    const tid = msg.thread_id;
    if (!threadsMap[tid]) {
      threadsMap[tid] = { thread_id: tid, name: '', email: '', messages: [], unreadCount: 0 };
    }
    threadsMap[tid].messages.push(msg);
    if (!threadsMap[tid].name && msg.sender === 'member' && msg.name) threadsMap[tid].name = msg.name;
    if (!threadsMap[tid].email && msg.email) threadsMap[tid].email = msg.email;
    if (msg.sender === 'member' && msg.unread) threadsMap[tid].unreadCount++;
  }

  const threads = Object.values(threadsMap).sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1].created_at;
    const bLast = b.messages[b.messages.length - 1].created_at;
    return new Date(bLast) - new Date(aLast);
  });

  if (threads.length === 0) {
    return <p style={{ color: '#9ca3af', fontSize: 14 }}>No member messages yet.</p>;
  }

  return (
    <div>
      {threads.map(thread => (
        <MemberThread key={thread.thread_id} thread={thread} onRefresh={onRefresh} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}

// ─── Send Email ───────────────────────────────────────────────────────────────

const DEFAULT_SUBJECT = 'Quick heads up on membership billing';
const DEFAULT_BODY = `Hey — thanks for being one of the first to join. Seriously.

We jumped the gun on how we set up billing and need to switch it over to our main site. Your membership is good this month, no question. We're going to cancel the Square charge on our end.

When you get a chance, sign up through here instead:
https://oneloveoutdoors.org/onelove-members-only

Same deal, same price. Just a better setup. And if you have any trouble, just reply to this email.

Being early means a lot to us. You're the reason this thing gets off the ground.

— One Love`;

function SendEmailView() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const recipients = to.split(',').map(s => s.trim()).filter(Boolean);
  const canSend = recipients.length > 0 && subject.trim() && body.trim();

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject: subject.trim(), text: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      const msg = data.warning
        ? `Partial send — ${data.warning}`
        : `Sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`;
      setResult({ ok: !data.warning, message: msg });
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
          <input
            type="text"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="email@example.com, another@example.com"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          {recipients.length > 0 && (
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 5, marginBottom: 0 }}>
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}: {recipients.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={14}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        {result && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: result.ok ? '#f0fdf4' : '#fef2f2',
            border: '1px solid ' + (result.ok ? '#bbf7d0' : '#fecaca'),
            color: result.ok ? '#166534' : '#dc2626',
          }}>
            {result.message}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend || sending}
          style={{
            padding: '12px 0', borderRadius: 9, fontSize: 15, fontWeight: 700,
            background: canSend ? '#1a3328' : '#9ca3af',
            color: '#fff', border: 'none', cursor: canSend ? 'pointer' : 'default',
          }}
        >
          {sending ? 'Sending...' : `Send${recipients.length > 1 ? ' (' + recipients.length + ')' : ''}`}
        </button>

      </div>
    </div>
  );
}

// ─── New Booking Modal ────────────────────────────────────────────────────────

const BIKE_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Cannondale', 'Santa Cruz', 'Yeti',
  'Pivot', 'Ibis', 'Marin', 'Kona', 'Canyon', 'Scott', 'GT',
  'Surly', 'Salsa', 'Co-op Cycles', 'Other',
];

const ISSUE_OPTIONS = ['Shifting', 'Brakes', 'Wheels', 'Suspension', 'Drivetrain', 'Tune-up', 'New bike assembly', 'Other'];

const ALL_STATUSES = [
  { value: 'new',             label: 'New'             },
  { value: 'confirmed',       label: 'Confirmed'       },
  { value: 'in_progress',     label: 'In Progress'     },
  { value: 'ready',           label: 'Ready'           },
  { value: 'out_for_delivery',label: 'Out for Delivery' },
  { value: 'complete',        label: 'Complete'        },
];

function NewBookingModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bikeBrand, setBikeBrand] = useState('');
  const [issues, setIssues] = useState([]);
  const [notes, setNotes] = useState('');
  const [contactPref, setContactPref] = useState('text');
  const [isMember, setIsMember] = useState(false);
  const [status, setStatus] = useState('new');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  function toggleIssue(issue) {
    setIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setSubmitErr('Name and phone are required.');
      return;
    }
    setSubmitting(true);
    setSubmitErr('');
    try {
      // Geocode address before creating so lat/lng are stored from the start
      let lat = null, lng = null;
      if (address.trim()) {
        const coords = await geocodeAddress(address.trim());
        if (coords) { lat = coords.lat; lng = coords.lng; }
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
          lat,
          lng,
          bike_brand: bikeBrand || null,
          issues,
          notes: notes.trim() || null,
          contact_preference: contactPref,
          is_member: isMember,
          status,
          confirmed_date: pickupDate || null,
          confirmed_time: pickupTime || null,
          return_date: returnDate || null,
          admin_created: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitErr(data.error || 'Failed to create booking.');
        return;
      }
      onCreated();
    } catch {
      setSubmitErr('Network error — try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 11px', border: '1px solid #d1d5db',
    borderRadius: 7, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#111827',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', overflowY: 'auto', padding: '24px 16px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560,
        padding: 28, position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f1a14' }}>New Booking</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(860) 555-0000" type="tel" style={inputStyle} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email (optional)</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="they may not have one" type="email" style={inputStyle} />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Address *</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Hartford, CT" style={inputStyle} />
          </div>

          {/* Bike brand */}
          <div>
            <label style={labelStyle}>Bike brand (optional)</label>
            <select value={bikeBrand} onChange={e => setBikeBrand(e.target.value)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
              <option value="">— select brand —</option>
              {BIKE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Issues */}
          <div>
            <label style={labelStyle}>Issues</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ISSUE_OPTIONS.map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 14, color: '#374151', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={issues.includes(opt)}
                    onChange={() => toggleIssue(opt)}
                    style={{ accentColor: '#1a3328', cursor: 'pointer' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything to note from the call..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Contact preference */}
          <div>
            <label style={labelStyle}>Contact preference</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['text', 'Text'], ['email', 'Email'], ['phone', 'Phone only']].map(([val, lbl]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
                  <input type="radio" name="contactPref" value={val} checked={contactPref === val} onChange={() => setContactPref(val)} style={{ accentColor: '#1a3328', cursor: 'pointer' }} />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          {/* Member + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#374151', paddingBottom: 9 }}>
                <input type="checkbox" checked={isMember} onChange={e => setIsMember(e.target.checked)} style={{ accentColor: '#1a3328', width: 16, height: 16, cursor: 'pointer' }} />
                Member
              </label>
            </div>
          </div>

          {/* Pickup date + time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Pickup date (optional)</label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => {
                  setPickupDate(e.target.value);
                  if (e.target.value && !returnDate) setReturnDate(pickupToReturn(e.target.value));
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Pickup time (optional)</label>
              <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Return date */}
          <div>
            <label style={labelStyle}>Est. return date (optional)</label>
            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} style={inputStyle} />
          </div>

          {submitErr && (
            <p style={{ margin: 0, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#dc2626' }}>
              {submitErr}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '10px 24px', background: submitting ? '#9ca3af' : '#1a3328', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff', cursor: submitting ? 'default' : 'pointer' }}
            >
              {submitting ? 'Saving...' : 'Create Booking'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminServicePage() {
  const [bookings, setBookings] = useState([]);
  const [memberMessages, setMemberMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [unreadCounts, setUnreadCounts] = useState({ total: 0, counts: {} });
  const [memberUnread, setMemberUnread] = useState(0);
  const [icalOpen, setIcalOpen] = useState(false);
  const [icalUrl, setIcalUrl] = useState('');
  const [icalCopied, setIcalCopied] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bRes, uRes, mmRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/messages/unread'),
        fetch('/api/member-messages'),
      ]);
      const bData = await bRes.json();
      const uData = uRes.ok ? await uRes.json() : { total: 0, counts: {} };
      const mmData = mmRes.ok ? await mmRes.json() : { messages: [] };
      if (!bRes.ok) { setError(bData.error || 'Failed to load'); return; }
      const loadedBookings = bData.bookings || [];
      setBookings(loadedBookings);
      setUnreadCounts({ total: uData.total || 0, counts: uData.counts || {} });

      // Backfill lat/lng for bookings with address but no coordinates
      const missing = loadedBookings.filter(b => b.address && !b.lat && !b.lng);
      if (missing.length > 0) {
        (async () => {
          for (const b of missing) {
            const coords = await geocodeAddress(b.address);
            if (coords) {
              fetch('/api/bookings/' + b.id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
              }).catch(() => {});
              setBookings(prev => prev.map(p => p.id === b.id ? { ...p, lat: coords.lat, lng: coords.lng } : p));
            }
            if (missing.indexOf(b) < missing.length - 1) {
              await new Promise(r => setTimeout(r, 1100)); // Nominatim: max 1 req/sec
            }
          }
        })();
      }
      const msgs = mmData.messages || [];
      setMemberMessages(msgs);
      setMemberUnread(msgs.filter(m => m.sender === 'member' && m.unread).length);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleMarkRead(bookingId) {
    setUnreadCounts(prev => {
      const newCounts = { ...prev.counts, [bookingId]: 0 };
      const newTotal = Object.values(newCounts).reduce((a, b) => a + b, 0);
      return { total: newTotal, counts: newCounts };
    });
  }

  function handleMemberMarkRead(threadId) {
    setMemberMessages(prev => prev.map(m =>
      m.thread_id === threadId && m.sender === 'member' ? { ...m, unread: false } : m
    ));
    setMemberUnread(prev => Math.max(0, prev - 1));
  }

  useEffect(() => { load(); }, []);

  const newCount = bookings.filter(b => b.status === 'new').length;

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', paddingBottom: 60 }}>
      <div style={{
        background: '#0f1a14', padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'requests', label: 'All Requests' + (newCount > 0 ? ' (' + newCount + ')' : ''), badge: unreadCounts.total },
            { key: 'plan',     label: 'Plan Route', badge: 0 },
            { key: 'members',  label: 'Member Messages', badge: memberUnread },
            { key: 'email',    label: 'Send Email', badge: 0 },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                background: activeTab === t.key ? '#4ade80' : 'transparent',
                color: activeTab === t.key ? '#0f1a14' : '#9ca3af',
                border: 'none', fontWeight: activeTab === t.key ? 700 : 400,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {t.label}
              {t.badge > 0 && (
                <span style={{
                  width: 8, height: 8, background: '#dc2626', borderRadius: '50%',
                  display: 'inline-block', flexShrink: 0,
                }} />
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setNewBookingOpen(true)}
            style={{ background: '#4ade80', border: 'none', color: '#0f1a14', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + New Booking
          </button>
          <button
            onClick={async () => {
              if (!icalUrl) {
                try {
                  const res = await fetch('/api/admin/ical-url');
                  const { url } = await res.json();
                  if (url) setIcalUrl(url);
                } catch {}
              }
              setIcalOpen(o => !o);
            }}
            style={{ background: 'none', border: '1px solid #6b7280', color: '#9ca3af', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
          >
            📅 Subscribe to calendar
          </button>
          <button
            onClick={load}
            style={{ background: 'none', border: '1px solid #4ade80', color: '#4ade80', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {icalOpen && (
        <div style={{ background: '#1a2b22', borderBottom: '1px solid #2d4a38', padding: '16px 20px' }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <input
                readOnly
                value={icalUrl || 'Loading...'}
                style={{ flex: 1, padding: '7px 12px', borderRadius: 7, border: '1px solid #2d4a38', background: '#0f1a14', color: '#d1fae5', fontSize: 13, fontFamily: 'monospace' }}
              />
              <button
                onClick={async () => {
                  if (!icalUrl) return;
                  await navigator.clipboard.writeText(icalUrl);
                  setIcalCopied(true);
                  setTimeout(() => setIcalCopied(false), 2500);
                }}
                style={{ padding: '7px 16px', background: icalCopied ? '#16a34a' : '#2d4a38', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {icalCopied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
            <p style={{ color: '#6b9e7e', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {'Apple Calendar: File → New Calendar Subscription → paste URL. '}
              {'Google Calendar: Other calendars → From URL → paste URL. '}
              {'Confirmed bookings will appear on your calendar automatically.'}
            </p>
          </div>
        </div>
      )}

      {unreadCounts.total > 0 && (
        <div
          onClick={() => setActiveTab('requests')}
          style={{
            background: '#dc2626', color: '#fff', padding: '12px 20px',
            fontSize: 14, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
          }}
        >
          {unreadCounts.total} unread message{unreadCounts.total !== 1 ? 's' : ''} from customers — tap to view
        </div>
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px 0' }}>
        {loading && <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</p>}
        {error && <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>}

        {!loading && activeTab === 'plan' && (
          <PlanRouteView allBookings={bookings} onRefresh={load} />
        )}
        {!loading && activeTab === 'requests' && (
          <AllRequestsView bookings={bookings} onRefresh={load} unreadCounts={unreadCounts.counts} onMarkRead={handleMarkRead} />
        )}
        {!loading && activeTab === 'members' && (
          <MemberMessagesView messages={memberMessages} onRefresh={load} onMarkRead={handleMemberMarkRead} />
        )}
        {activeTab === 'email' && <SendEmailView />}
      </div>

      {newBookingOpen && (
        <NewBookingModal
          onClose={() => setNewBookingOpen(false)}
          onCreated={() => { setNewBookingOpen(false); load(); }}
        />
      )}
    </main>
  );
}
