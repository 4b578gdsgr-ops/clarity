'use client';
import { useState, useEffect } from 'react';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + suffix;
}

function downloadIcs(ride) {
  const dt = ride.date.replace(/-/g, '');
  const [hh, mm] = (ride.time || '09:00').split(':');
  const endH = String((parseInt(hh) + 2) % 24).padStart(2, '0');
  const desc = (ride.description || '').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//One Love Outdoors//Group Rides//EN',
    'BEGIN:VEVENT',
    'UID:' + ride.id + '@oneloveoutdoors.org',
    'DTSTART:' + dt + 'T' + hh + mm + '00',
    'DTEND:' + dt + 'T' + endH + mm + '00',
    'SUMMARY:' + ride.title,
    'LOCATION:' + ride.location,
    'DESCRIPTION:' + desc,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'one-love-ride.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export default function RidesPage() {
  const [ride, setRide] = useState(undefined);

  useEffect(() => {
    fetch('/api/rides')
      .then(r => r.json())
      .then(d => setRide(d.ride || null))
      .catch(() => setRide(null));
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '48px 16px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#0f1a14', marginBottom: 8 }}>
          This week&rsquo;s ride
        </h1>

        {ride === undefined && (
          <p style={{ color: '#9ca3af', fontSize: 15, marginTop: 24 }}>Loading...</p>
        )}

        {ride === null && (
          <p style={{ color: '#6b7280', fontSize: 16, lineHeight: 1.6, marginTop: 24 }}>
            No ride scheduled this week. Check back soon.
          </p>
        )}

        {ride && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px 20px', marginTop: 24 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#0f1a14', marginBottom: 6 }}>
              {ride.title}
            </h2>
            <p style={{ fontSize: 16, color: '#374151', fontWeight: 600, marginBottom: 2 }}>
              {formatDate(ride.date)} at {formatTime(ride.time)}
            </p>
            <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 0 }}>
              {ride.location}
            </p>
            {ride.description && (
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: '16px 0 0', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                {ride.description}
              </p>
            )}
            <button
              onClick={() => downloadIcs(ride)}
              style={{
                marginTop: 24, padding: '10px 20px', background: '#1a3328', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              Add to calendar
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
