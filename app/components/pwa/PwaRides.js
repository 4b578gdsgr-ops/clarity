'use client';
import { useState, useEffect } from 'react';

function formatRideDate(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  if (!time) return label;
  const [h, min] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return label + ' at ' + h12 + ':' + String(min).padStart(2, '0') + ' ' + ampm;
}

export default function PwaRides({ onBack }) {
  const [rides, setRides] = useState(null);
  const [err, setErr] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/rides?all=1')
      .then(r => r.json())
      .then(d => setRides((d.rides || []).filter(r => r.date >= today)))
      .catch(() => setErr('Failed to load rides'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafaf7' }}>
      <div style={{
        padding: '16px 20px 12px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        borderBottom: '1px solid #e5e7eb', background: '#fff',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#2d8653', fontWeight: 600, padding: 0 }}
        >
          &larr; Home
        </button>
        <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#0f1a14', textAlign: 'center' }}>Rides</div>
        <div />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {rides === null && !err && (
          <p style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 40 }}>Loading...</p>
        )}
        {err && (
          <p style={{ color: '#dc2626', fontSize: 14, textAlign: 'center', marginTop: 40 }}>{err}</p>
        )}
        {rides !== null && rides.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, padding: '0 24px' }}>
            <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No upcoming rides.</p>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Check back soon.</p>
          </div>
        )}
        {rides !== null && rides.map(ride => (
          <div key={ride.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1a14', marginBottom: 4 }}>{ride.title}</div>
            <div style={{ fontSize: 13, color: '#2d8653', fontWeight: 600, marginBottom: (ride.location || ride.description || ride.gpx_url) ? 6 : 0 }}>
              {formatRideDate(ride.date, ride.time)}
            </div>
            {ride.location && (
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: (ride.description || ride.gpx_url) ? 6 : 0 }}>
                {ride.location}
              </div>
            )}
            {ride.description && (
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, margin: '0 0 ' + (ride.gpx_url ? '10px' : '0') }}>
                {ride.description}
              </p>
            )}
            {ride.gpx_url && (
              <a
                href={'/api/rides/' + ride.id + '/gpx'}
                download
                style={{ fontSize: 13, color: '#2d8653', fontWeight: 600, textDecoration: 'none' }}
              >
                Download route (GPX) &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
