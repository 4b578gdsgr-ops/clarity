'use client';
import { useState, useEffect } from 'react';

const NEXT_ACTION = {
  new:       { label: 'Confirm',    next: 'confirmed'  },
  confirmed: { label: 'Picked up', next: 'picked_up'  },
  picked_up: { label: 'Done',      next: 'done'        },
};

const STATUS_COLOR = {
  new:        '#f59e0b',
  confirmed:  '#3b82f6',
  picked_up:  '#8b5cf6',
  done:       '#16a34a',
  cancelled:  '#9ca3af',
  // legacy
  booked:     '#f59e0b',
  in_progress:'#8b5cf6',
  ready:      '#16a34a',
  delivered:  '#16a34a',
};

function BookingCard({ booking, onRefresh }) {
  const [confirmDate, setConfirmDate] = useState(booking.confirmed_date || '');
  const [confirmTime, setConfirmTime] = useState(booking.confirmed_time || '');
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function patch(fields) {
    await fetch('/api/bookings/' + booking.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    onRefresh();
  }

  async function saveDate(val) {
    setSaving(true);
    setConfirmDate(val);
    await patch({ confirmed_date: val || null });
    setSaving(false);
  }

  async function saveTime(val) {
    setSaving(true);
    setConfirmTime(val);
    await patch({ confirmed_time: val || null });
    setSaving(false);
  }

  async function advance() {
    const action = NEXT_ACTION[booking.status];
    if (!action) return;
    setAdvancing(true);
    await patch({ status: action.next });
    setAdvancing(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this booking?')) return;
    setDeleting(true);
    await fetch('/api/bookings/' + booking.id, { method: 'DELETE' });
    onRefresh();
  }

  const action = NEXT_ACTION[booking.status];
  const color = STATUS_COLOR[booking.status] || '#9ca3af';
  const hasIssues = booking.issues && booking.issues.length > 0;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: 20, marginBottom: 14, position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>{booking.name}</span>
          {booking.bike_brand && (
            <span style={{ marginLeft: 10, fontSize: 14, color: '#6b7280' }}>{booking.bike_brand}</span>
          )}
        </div>
        <span style={{
          background: color + '22', color: color, border: '1px solid ' + color + '55',
          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
        }}>
          {booking.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 14, color: '#374151', marginBottom: 12 }}>
        {booking.phone && (
          <span><strong>Phone:</strong> <a href={'tel:' + booking.phone} style={{ color: '#1a3328' }}>{booking.phone}</a></span>
        )}
        {booking.email && (
          <span><strong>Email:</strong> <a href={'mailto:' + booking.email} style={{ color: '#1a3328' }}>{booking.email}</a></span>
        )}
        {booking.preferred_day && (
          <span><strong>Prefers:</strong> {booking.preferred_day}{booking.time_slot ? ', ' + booking.time_slot : ''}</span>
        )}
        {booking.address && (
          <span style={{ gridColumn: '1 / -1' }}>
            <strong>Address:</strong>{' '}
            <a
              href={'https://maps.google.com/?q=' + encodeURIComponent(booking.address)}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1a3328' }}
            >
              {booking.address}
            </a>
          </span>
        )}
        {booking.lat && booking.lng && !booking.address && (
          <span style={{ gridColumn: '1 / -1' }}>
            <strong>Pin:</strong>{' '}
            <a
              href={'https://maps.google.com/?q=' + booking.lat + ',' + booking.lng}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1a3328' }}
            >
              {Number(booking.lat).toFixed(5)}, {Number(booking.lng).toFixed(5)}
            </a>
          </span>
        )}
      </div>

      {hasIssues && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Issues: </span>
          {booking.issues.map(issue => (
            <span key={issue} style={{
              display: 'inline-block', marginRight: 6, marginBottom: 4,
              background: '#f3f4f6', borderRadius: 12, padding: '2px 10px', fontSize: 13,
            }}>
              {issue}
            </span>
          ))}
        </div>
      )}

      {booking.notes && (
        <p style={{ fontSize: 14, color: '#4b5563', background: '#f9fafb', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
          {booking.notes}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>Confirmed date</label>
          <input
            type="date"
            value={confirmDate}
            onChange={e => saveDate(e.target.value)}
            style={{
              padding: '6px 10px', border: '1px solid', borderRadius: 7, fontSize: 14,
              borderColor: confirmDate ? '#16a34a' : '#d1d5db',
              color: confirmDate ? '#166534' : '#374151',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>Confirmed time</label>
          <input
            type="time"
            value={confirmTime}
            onChange={e => saveTime(e.target.value)}
            style={{
              padding: '6px 10px', border: '1px solid', borderRadius: 7, fontSize: 14,
              borderColor: confirmTime ? '#16a34a' : '#d1d5db',
              color: confirmTime ? '#166534' : '#374151',
              outline: 'none',
            }}
          />
        </div>
        {saving && <span style={{ fontSize: 13, color: '#9ca3af' }}>Saving...</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {action && (
          <button
            onClick={advance}
            disabled={advancing}
            style={{
              padding: '8px 18px', background: '#1a3328', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
            }}
          >
            {advancing ? '...' : action.label}
          </button>
        )}
        {booking.status === 'done' && (
          <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>Complete</span>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            marginLeft: 'auto', padding: '6px 14px', background: 'none',
            border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13,
            color: '#dc2626', cursor: 'pointer',
          }}
        >
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminServicePage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load'); return; }
      setBookings(data.bookings || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const FILTERS = [
    { key: 'new',       label: 'New'       },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'done',      label: 'Done'      },
    { key: 'all',       label: 'All'       },
  ];

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = {};
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] || 0) + 1;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', padding: '0 0 48px' }}>
      <div style={{ background: '#0f1a14', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: 20, fontStyle: 'italic' }}>
          Service Admin
        </span>
        <button
          onClick={load}
          style={{ background: 'none', border: '1px solid #4ade80', color: '#4ade80', borderRadius: 8, padding: '6px 14px', fontSize: 14, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count = f.key === 'all' ? bookings.length : (counts[f.key] || 0);
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
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

        {loading && <p style={{ color: '#9ca3af', fontSize: 15 }}>Loading...</p>}
        {error && <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 15 }}>
            {filter === 'all' ? 'No bookings yet.' : 'No ' + filter + ' bookings.'}
          </p>
        )}

        {filtered.map(b => (
          <BookingCard key={b.id} booking={b} onRefresh={load} />
        ))}
      </div>
    </main>
  );
}
