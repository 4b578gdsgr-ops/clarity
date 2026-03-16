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

// Next logical state + button label per current status
const NEXT_ACTION = {
  booked:      { label: 'Mark picked up',   next: 'picked_up',   color: '#2563eb' },
  picked_up:   { label: 'Mark in progress', next: 'in_progress', color: '#ca8a04' },
  in_progress: { label: 'Mark ready',       next: 'ready',       color: '#7c3aed' },
  ready:       { label: 'Mark delivered',   next: 'delivered',   color: '#16a34a' },
};

// ─── Route math ───────────────────────────────────────────────────────────────

// Central CT — route start point
const DEPOT = { lat: 41.6943, lng: -72.7149 };

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const r = d => d * Math.PI / 180;
  const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighborSort(bookings) {
  const withCoords = bookings.filter(b => b.lat && b.lng);
  const noCoords   = bookings.filter(b => !b.lat || !b.lng);
  if (withCoords.length <= 1) return bookings;

  const sorted = [], remaining = [...withCoords];
  let cur = DEPOT;

  while (remaining.length > 0) {
    let minDist = Infinity, minIdx = 0;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(cur.lat, cur.lng, remaining[i].lat, remaining[i].lng);
      if (d < minDist) { minDist = d; minIdx = i; }
    }
    sorted.push(remaining[minIdx]);
    cur = remaining[minIdx];
    remaining.splice(minIdx, 1);
  }
  return [...sorted, ...noCoords];
}

function legInfo(a, b) {
  if (!a?.lat || !b?.lat) return null;
  const mi = haversine(a.lat, a.lng, b.lat, b.lng);
  const mins = Math.round(mi * (60 / 25) + 3); // ~25 mph avg + 3 min buffer
  return { mi: mi.toFixed(1), mins };
}

// ─── Map URL builders ─────────────────────────────────────────────────────────

function googleMapsUrl(bookings) {
  const pts = bookings.filter(b => b.lat && b.lng);
  if (!pts.length) return null;
  return `https://www.google.com/maps/dir/${pts.map(b => `${b.lat},${b.lng}`).join('/')}`;
}

// Per-stop Apple Maps navigate link (reliable single-destination)
function appleStopUrl(b) {
  if (b.lat && b.lng) return `https://maps.apple.com/?daddr=${b.lat},${b.lng}&dirflg=d`;
  const addr = encodeURIComponent(`${b.address}, ${b.city}, CT ${b.zip}`);
  return `https://maps.apple.com/?daddr=${addr}&dirflg=d`;
}

// Full-route Apple Maps — passes waypoints as saddr/daddr chain
function appleMapsRouteUrl(bookings) {
  const pts = bookings.filter(b => b.lat && b.lng);
  if (!pts.length) return null;
  if (pts.length === 1) return appleStopUrl(pts[0]);
  // maps:// scheme with multiple daddr params (iOS 16+ supports this as waypoints)
  const base = pts.map((b, i) =>
    (i === 0 ? `saddr=Current+Location&daddr=${b.lat},${b.lng}` : `daddr=${b.lat},${b.lng}`)
  ).join('&');
  return `maps://?${base}&dirflg=d`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPickups() {
  const [date, setDate]           = useState(today());
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [icalUrl, setIcalUrl]     = useState(null);
  const [icalCopied, setIcalCopied] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  // Fetch iCal URL once (token stays server-side)
  useEffect(() => {
    fetch('/api/admin/ical-url')
      .then(r => r.json())
      .then(d => { if (d.url) setIcalUrl(d.url); })
      .catch(() => {});
    // Also fetch total pending bookings count across all dates
    fetch('/api/bookings?status=booked')
      .then(r => r.json())
      .then(d => setPendingCount((d.bookings || []).length))
      .catch(() => {});
  }, []);

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
    else if (status === 'delivered' || status === 'cancelled') {
      // Refresh pending count
      fetch('/api/bookings?status=booked')
        .then(r => r.json())
        .then(d => setPendingCount((d.bookings || []).length))
        .catch(() => {});
    }
  };

  const optimizeRoute = () => setBookings(bs => nearestNeighborSort(bs));

  const copyIcalUrl = () => {
    if (!icalUrl) return;
    navigator.clipboard.writeText(icalUrl).then(() => {
      setIcalCopied(true);
      setTimeout(() => setIcalCopied(false), 2500);
    });
  };

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

  const gMapsUrl = googleMapsUrl(bookings);
  const aMapsUrl = appleMapsRouteUrl(bookings);
  const hasCoords = bookings.filter(b => b.lat && b.lng).length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>
          Admin · Service
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#2d3436' }}>
            Service Schedule
          </h1>
          {pendingCount > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 20 }}>
              {pendingCount} pending
            </span>
          )}
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ border: '1px solid #e5e0d8', borderRadius: 8, padding: '5px 10px', fontSize: 14, color: '#2d3436', background: '#fff' }}
          />
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            {bookings.length} stop{bookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action toolbar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasCoords > 1 && (
            <button onClick={optimizeRoute}
              style={{ background: '#f0faf5', color: '#2d8653', border: '1px solid #d1ead9', padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ⚡ Optimize route
            </button>
          )}
          {aMapsUrl && (
            <a href={aMapsUrl}
              style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              🗺 Apple Maps
            </a>
          )}
          {gMapsUrl && (
            <a href={gMapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ background: '#fff7ed', color: '#d97706', border: '1px solid #fed7aa', padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              Google Maps →
            </a>
          )}
          {icalUrl && (
            <button onClick={copyIcalUrl}
              style={{ background: icalCopied ? '#f0faf5' : '#faf9f6', color: icalCopied ? '#2d8653' : '#636e72', border: `1px solid ${icalCopied ? '#d1ead9' : '#e5e0d8'}`, padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {icalCopied ? '✓ Copied!' : '📅 Copy iCal URL'}
            </button>
          )}
        </div>
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
          No service appointments for this date.
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <>
          {/* Map */}
          <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e0d8' }}>
            <PickupMap bookings={bookings} />
          </div>

          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Route order · drag to reorder
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {bookings.map((b, i) => {
              const zoneInfo = b.zone ? ZONES[b.zone] : null;
              const sc = STATUS_COLORS[b.status] || STATUS_COLORS.booked;
              const nextAction = NEXT_ACTION[b.status];
              const leg = i > 0 ? legInfo(bookings[i - 1], b) : null;

              return (
                <div key={b.id}>
                  {/* Distance/time between stops */}
                  {leg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 4px 10px', color: '#9ca3af', fontSize: 11 }}>
                      <span style={{ color: '#d1ead9' }}>│</span>
                      <span>~{leg.mins} min · {leg.mi} mi</span>
                    </div>
                  )}

                  {/* Booking card */}
                  <div
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
                      marginBottom: 0,
                    }}
                  >
                    {/* Stop number */}
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: zoneInfo?.color || '#636e72',
                      color: '#fff', fontWeight: 800, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: '#2d3436', fontSize: 14 }}>{b.name}</span>
                        {b.is_member && (
                          <span style={{ background: '#f0eeff', color: '#9333ea', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                            MEMBER ♥
                          </span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: sc.bg, color: sc.text }}>
                          {b.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 11 }} title={b.pickup_type === 'meetup' ? `Meetup: ${b.meetup_spot || 'TBD'}` : 'Home pickup'}>
                          {b.pickup_type === 'meetup' ? '📍' : '🏠'}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: '#636e72' }}>
                        {b.pickup_type === 'meetup'
                          ? `Meetup${b.meetup_spot ? ` — ${b.meetup_spot}` : ''} · ${b.city || b.zip}`
                          : `${b.address}, ${b.city} ${b.zip}`}
                      </div>

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
                        <a href={`tel:${b.phone}`} style={{ fontSize: 12, color: '#2d8653', marginTop: 3, display: 'block' }}>
                          {b.phone}
                        </a>
                      )}

                      {/* Quick status actions */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {nextAction && (
                          <button
                            onClick={e => { e.stopPropagation(); updateStatus(b.id, nextAction.next); }}
                            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: `1px solid ${nextAction.color}33`, background: nextAction.color + '15', color: nextAction.color, cursor: 'pointer' }}
                          >
                            {nextAction.label}
                          </button>
                        )}
                        {b.status !== 'cancelled' && b.status !== 'delivered' && (
                          <button
                            onClick={e => { e.stopPropagation(); updateStatus(b.id, 'cancelled'); }}
                            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a533', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        )}
                        <a
                          href={appleStopUrl(b)}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0ea5e9', textDecoration: 'none' }}
                        >
                          Navigate →
                        </a>
                      </div>
                    </div>

                    {/* Time slot + status select */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#2d3436' }}>{b.time_slot}</div>
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
                </div>
              );
            })}
          </div>

          {/* Bottom route buttons */}
          {(gMapsUrl || aMapsUrl) && (
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {aMapsUrl && (
                <a href={aMapsUrl}
                  style={{ background: '#0ea5e9', color: '#fff', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  🗺 Full route — Apple Maps
                </a>
              )}
              {gMapsUrl && (
                <a href={gMapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#fff', color: '#d97706', border: '1px solid #fed7aa', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Full route — Google Maps →
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
