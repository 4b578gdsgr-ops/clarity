'use client';
import { useState, useEffect, useRef } from 'react';

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

const BASE = 'https://clarity-pi-ten.vercel.app';

export default function EmbedBookingStatusPage({ params }) {
  const { bookingId } = params;
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);

  async function loadData() {
    try {
      const [bRes, mRes] = await Promise.all([
        fetch('/api/bookings/' + bookingId),
        fetch('/api/messages?booking_id=' + bookingId),
      ]);
      if (!bRes.ok) { setNotFound(true); setLoading(false); return; }
      const bData = await bRes.json();
      const mData = await mRes.json();
      console.log('[embed/service] booking API response:', JSON.stringify(bData));
      setBooking(bData.booking || bData);
      setMessages(mData.messages || []);
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

      {/* Payment section */}
      {['complete', 'done', 'delivered'].includes(booking.status) && booking.invoice_amount != null && (
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
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                  {fmt(m.created_at)}
                </div>
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
