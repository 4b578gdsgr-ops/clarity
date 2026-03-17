'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('../../components/RouteMap'), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────

const NEXT_ACTION = {
  new:         { label: 'Confirm',      next: 'confirmed'   },
  confirmed:   { label: 'Picked up',    next: 'picked_up'   },
  picked_up:   { label: 'In Progress',  next: 'in_progress' },
  in_progress: { label: 'Done',         next: 'done'        },
};

const STATUS_COLOR = {
  new:         '#f59e0b',
  confirmed:   '#3b82f6',
  picked_up:   '#8b5cf6',
  in_progress: '#f97316',
  done:        '#16a34a',
  cancelled:   '#9ca3af',
  booked:      '#f59e0b',
  ready:       '#16a34a',
  delivered:   '#16a34a',
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
  const autoReturn = pickupToReturn(pickupDate);
  const isDelayed = returnDate && autoReturn && returnDate !== autoReturn;
  const issues = booking.issues && booking.issues.length > 0
    ? booking.issues.join(', ').toLowerCase()
    : 'your bike';
  switch (newStatus) {
    case 'confirmed':
      return 'Hi ' + name + ', your pickup is confirmed for ' + pickupWhen + '. Plan on having it back by ' + returnWhen + '. We\'ll reach out when we\'re on the way. — One Love';
    case 'picked_up':
      return 'Hi ' + name + ', we\'ve got your bike. Plan on having it back by ' + returnWhen + '. We\'ll keep you posted. — One Love';
    case 'in_progress':
      if (isDelayed) {
        return 'Hi ' + name + ', parts are on order — updated return is ' + returnWhen + '. We\'ll keep you posted. — One Love';
      }
      return 'Hi ' + name + ', we\'re working on ' + issues + '. Your bike will be ready for delivery ' + returnWhen + '. — One Love';
    case 'done':
      return 'Hi ' + name + ', your bike is ready! We\'ll deliver it on ' + returnWhen + '. — One Love';
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
              <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, textAlign: 'right' }}>
                {new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({ booking, onRefresh, unreadCount = 0, onMarkRead }) {
  const [confirmDate, setConfirmDate] = useState(booking.confirmed_date || '');
  const [confirmTime, setConfirmTime] = useState(booking.confirmed_time || '');
  const [returnDate, setReturnDate] = useState(booking.return_date || (booking.confirmed_date ? pickupToReturn(booking.confirmed_date) : ''));
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
                background: booking.contact_preference === 'text' ? '#dbeafe' : '#ede9fe',
                color: booking.contact_preference === 'text' ? '#1d4ed8' : '#6d28d9',
                border: '1px solid ' + (booking.contact_preference === 'text' ? '#bfdbfe' : '#ddd6fe'),
                borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {booking.contact_preference === 'text' ? 'Text' : 'Email'}
              </span>
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
          {booking.address && (
            <span>
              <strong>Address: </strong>
              <a
                href={'https://maps.apple.com/?q=' + encodeURIComponent(booking.address)}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1a3328' }}
              >
                {booking.address}
              </a>
            </span>
          )}
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
              {booking.return_date && booking.confirmed_date && booking.return_date !== pickupToReturn(booking.confirmed_date) && (
                <span style={{ marginLeft: 6, color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>DELAYED</span>
              )}
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

        {/* Est. return */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
              Est. return
              {returnDate && returnDate !== pickupToReturn(confirmDate) && (
                <span style={{ marginLeft: 6, color: '#f59e0b', fontWeight: 700 }}>— delayed</span>
              )}
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
    const dayBookings = allBookings.filter(b =>
      b.confirmed_date === date && b.status !== 'done' && b.status !== 'cancelled'
    );
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
    await Promise.all(stops.map(s =>
      fetch('/api/bookings/' + s.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: s.status === 'new' ? 'confirmed' : s.status,
          confirmed_date: date,
          confirmed_time: times[s.id] || null,
        }),
      })
    ));
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
            {'No bookings with confirmed_date = ' + date}
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
                width: 28, height: 28, background: '#1a3328', color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{stop.name}</div>
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
    { key: 'new',         label: 'New'         },
    { key: 'confirmed',   label: 'Confirmed'   },
    { key: 'picked_up',  label: 'Picked Up'   },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done',        label: 'Done'        },
    { key: 'all',         label: 'All'         },
  ];

  const counts = {};
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] || 0) + 1;
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.key === 'all' ? bookings.length : (counts[f.key] || 0);
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminServicePage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('plan');
  const [unreadCounts, setUnreadCounts] = useState({ total: 0, counts: {} });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bRes, uRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/messages/unread'),
      ]);
      const bData = await bRes.json();
      const uData = uRes.ok ? await uRes.json() : { total: 0, counts: {} };
      if (!bRes.ok) { setError(bData.error || 'Failed to load'); return; }
      setBookings(bData.bookings || []);
      setUnreadCounts({ total: uData.total || 0, counts: uData.counts || {} });
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
            { key: 'plan',     label: 'Plan Route' },
            { key: 'requests', label: 'All Requests' + (newCount > 0 ? ' (' + newCount + ')' : '') },
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
              {t.key === 'requests' && unreadCounts.total > 0 && (
                <span style={{
                  width: 8, height: 8, background: '#dc2626', borderRadius: '50%',
                  display: 'inline-block', flexShrink: 0,
                }} />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          style={{ background: 'none', border: '1px solid #4ade80', color: '#4ade80', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

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
      </div>
    </main>
  );
}
