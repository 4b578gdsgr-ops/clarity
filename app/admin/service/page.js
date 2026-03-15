'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ZONES } from '../../../lib/serviceZones';

const PickupMap = dynamic(() => import('./PickupMap'), { ssr: false });

const STATUS_OPTIONS = ['booked', 'picked_up', 'in_progress', 'ready', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  booked:      { bg: '#dcfce7', text: '#16a34a' },
  picked_up:   { bg: '#dbeafe', text: '#2563eb' },
  in_progress: { bg: '#fef9c3', text: '#ca8a04' },
  ready:       { bg: '#ede9fe', text: '#7c3aed' },
  delivered:   { bg: '#f3f4f6', text: '#6b7280' },
  cancelled:   { bg: '#fee2e2', text: '#dc2626' },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function mapsUrl(bookings) {
  const pts = bookings.filter(b => b.lat && b.lng);
  if (pts.length === 0) return null;
  const coords = pts.map(b => `${b.lat},${b.lng}`).join('/');
  return `https://www.google.com/maps/dir/${coords}`;
}

export default function AdminPickups() {
  const [date, setDate] = useState(today());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const load = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings?date=${d}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setBookings(json.bookings || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const updateStatus = async (id, status) => {
    const prev = bookings;
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setBookings(prev);
  };

  // Drag-to-reorder
  const onDragStart = (e, i) => { dragItem.current = i; };
  const onDragEnter = (e, i) => { dragOver.current = i; };
  const onDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const next = [...bookings];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    setBookings(next);
    dragItem.current = null;
    dragOver.current = null;
  };

  const routeUrl = mapsUrl(bookings);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>
          Admin · Service
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#2d3436' }}>
            Service Schedule
          </h1>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ border: '1px solid #e5e0d8', borderRadius: 8, padding: '5px 10px', fontSize: 14, color: '#2d3436', background: '#fff' }}
          />
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            {bookings.length} stop{bookings.length !== 1 ? 's' : ''}
          </span>
          {routeUrl && (
            <a href={routeUrl} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: 'auto', background: '#2d8653', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Open in Google Maps →
            </a>
          )}
        </div>
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(ZONES).map(([key, z]) => (
          <span key={key} style={{ fontSize: 11, fontWeight: 600, background: z.color + '22', color: z.color, padding: '3px 10px', borderRadius: 20 }}>
            {z.label}
          </span>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 28, height: 28, border: '2px solid #e5e0d8', borderTopColor: '#2d8653', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading...</div>
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14 }}>
          No service appointments scheduled for this date.
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <>
          {/* Map */}
          <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e0d8' }}>
            <PickupMap bookings={bookings} />
          </div>

          {/* Route list — drag to reorder */}
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Route order · drag to reorder
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookings.map((b, i) => {
              const zoneInfo = b.zone ? ZONES[b.zone] : null;
              const sc = STATUS_COLORS[b.status] || STATUS_COLORS.booked;
              return (
                <div
                  key={b.id}
                  draggable
                  onDragStart={e => onDragStart(e, i)}
                  onDragEnter={e => onDragEnter(e, i)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => e.preventDefault()}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e0d8',
                    borderLeft: `4px solid ${zoneInfo?.color || '#e5e0d8'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'grab',
                    userSelect: 'none',
                  }}
                >
                  {/* Stop number */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: zoneInfo?.color || '#636e72',
                    color: '#fff', fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: '#2d3436', fontSize: 14 }}>{b.name}</span>
                      {b.is_member && (
                        <span style={{ background: '#f0eeff', color: '#9333ea', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                          MEMBER
                        </span>
                      )}
                      <span style={{ ...sc, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: sc.bg, color: sc.text }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#636e72' }}>{b.address}, {b.city} {b.zip}</div>
                    {(b.bike_brand || b.bike_model) && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {[b.bike_brand, b.bike_model].filter(Boolean).join(' ')}
                      </div>
                    )}
                    {b.issues?.length > 0 && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {b.issues.join(', ')}
                      </div>
                    )}
                    {b.notes && (
                      <div style={{ fontSize: 12, color: '#636e72', marginTop: 4, fontStyle: 'italic' }}>
                        {b.notes}
                      </div>
                    )}
                    {b.phone && (
                      <a href={`tel:${b.phone}`} style={{ fontSize: 12, color: '#2d8653', marginTop: 2, display: 'block' }}>
                        {b.phone}
                      </a>
                    )}
                  </div>

                  {/* Time slot */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2d3436' }}>{b.time_slot}</div>
                    {/* Status changer */}
                    <select
                      value={b.status}
                      onChange={e => updateStatus(b.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      style={{ marginTop: 6, fontSize: 11, border: '1px solid #e5e0d8', borderRadius: 6, padding: '3px 6px', background: '#f9f9f9', cursor: 'pointer' }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {routeUrl && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <a href={routeUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', background: '#2d8653', color: '#fff', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Open full route in Google Maps →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
