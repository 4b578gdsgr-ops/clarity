'use client';
import { useState, useEffect, useRef } from 'react';

const STATUS_HEADING = {
  new:             "We'll be in touch soon.",
  confirmed:       "We'll be in touch soon.",
  picked_up:       "Your bike is in good hands.",
  in_progress:     "Your bike is in good hands.",
  ready:           "Your bike is ready.",
  out_for_delivery:"Your bike is on its way back.",
  complete:        "All set. Ride on.",
  done:            "All set. Ride on.",
  delivered:       "All set. Ride on.",
  booked:          "We'll be in touch soon.",
};

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

const STATUS_STEPS = ['new', 'confirmed', 'picked_up', 'in_progress', 'ready', 'out_for_delivery', 'complete'];

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
};

function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

export default function BookingStatusPage({ params }) {
  const { id } = params;
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
        fetch('/api/bookings/' + id),
        fetch('/api/messages?booking_id=' + id),
      ]);
      if (!bRes.ok) { setNotFound(true); setLoading(false); return; }
      const bData = await bRes.json();
      const mData = await mRes.json();
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
  }, [id]);

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

  const currentStep = STATUS_STEPS.indexOf(booking.status);
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
          {STATUS_HEADING[booking.status] || "We'll be in touch soon."}
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

        {/* Message thread */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafaf7' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Messages</span>
          </div>

          <div style={{ padding: 16, minHeight: 120, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>
          {'Bookmark this page to check your status anytime.'}
        </p>
      </div>
    </main>
  );
}
