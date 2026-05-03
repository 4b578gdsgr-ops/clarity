'use client';
import { useState, useEffect } from 'react';

const STATUS = {
  new:              { label: 'Submitted',       bg: '#fef3c7', color: '#92400e' },
  confirmed:        { label: 'Confirmed',        bg: '#dbeafe', color: '#1e40af' },
  picked_up:        { label: 'Picked up',        bg: '#e0e7ff', color: '#3730a3' },
  in_progress:      { label: 'In progress',      bg: '#ede9fe', color: '#6d28d9' },
  ready:            { label: 'Ready',            bg: '#d1fae5', color: '#065f46' },
  out_for_delivery: { label: 'Out for delivery', bg: '#cffafe', color: '#0e7490' },
  complete:         { label: 'Complete',         bg: '#f3f4f6', color: '#374151' },
  cancelled:        { label: 'Cancelled',        bg: '#fee2e2', color: '#991b1b' },
  no_show:          { label: 'No show',          bg: '#fee2e2', color: '#991b1b' },
};

const ACTIVE = new Set(['new', 'confirmed', 'picked_up', 'in_progress', 'ready', 'out_for_delivery']);

function formatDate(d) {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function BikeLabel({ booking }) {
  if (booking.bikes?.length > 0) {
    const b = booking.bikes[0];
    return <span>{b.brand ? b.brand + ' — ' : ''}{(b.issues || []).slice(0, 2).join(', ') || 'Service'}</span>;
  }
  return <span>{booking.bike_brand ? booking.bike_brand + ' — ' : ''}{(booking.issues || []).slice(0, 2).join(', ') || 'Service'}</span>;
}

export default function PwaBookings({ profile, onBack }) {
  const [bookings, setBookings] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/pwa/bookings?phone=' + encodeURIComponent(profile.phone))
      .then(r => r.json())
      .then(d => { if (d.bookings) setBookings(d.bookings); else setErr(d.error || 'Failed to load'); })
      .catch(() => setErr('Network error'));
  }, []);

  const active = (bookings || []).filter(b => ACTIVE.has(b.status));
  const past = (bookings || []).filter(b => !ACTIVE.has(b.status));

  function BookingCard({ b }) {
    const st = STATUS[b.status] || { label: b.status, bg: '#f3f4f6', color: '#374151' };
    const pickupDate = b.confirmed_date ? formatDate(b.confirmed_date) : null;
    const returnDate = b.return_date ? formatDate(b.return_date) : null;

    return (
      <a
        href={'/service/' + b.id}
        style={{
          display: 'block', textDecoration: 'none',
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '14px 16px', marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1a14', flex: 1, marginRight: 10 }}>
            <BikeLabel booking={b} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, background: st.bg, color: st.color, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
            {st.label}
          </span>
        </div>
        {(pickupDate || returnDate) && (
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {pickupDate && <span>Pickup {pickupDate}</span>}
            {pickupDate && returnDate && <span> &rarr; </span>}
            {returnDate && <span>Back {returnDate}</span>}
          </div>
        )}
        {!pickupDate && (
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Submitted {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#2d8653', marginTop: 6, fontWeight: 600 }}>
          View details &rarr;
        </div>
      </a>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fafaf7' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#2d8653', fontSize: 15, fontFamily: 'inherit' }}
        >
          Back
        </button>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f1a14' }}>My Bookings</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {bookings === null && !err && (
          <p style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 40 }}>Loading...</p>
        )}
        {err && (
          <p style={{ color: '#dc2626', fontSize: 14, textAlign: 'center', marginTop: 40 }}>{err}</p>
        )}

        {bookings !== null && bookings.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, padding: '0 24px' }}>
            <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No bookings yet.</p>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Book a service to get started.</p>
          </div>
        )}

        {active.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Active
            </div>
            {active.map(b => <BookingCard key={b.id} b={b} />)}
          </>
        )}

        {past.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: active.length > 0 ? 20 : 0 }}>
              Past
            </div>
            {past.map(b => <BookingCard key={b.id} b={b} />)}
          </>
        )}
      </div>
    </div>
  );
}
