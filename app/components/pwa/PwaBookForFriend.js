'use client';
import { useState } from 'react';
import { getProfile } from '../../../lib/pwaProfile';
import { saveBookingId } from '../../../lib/pwaBookings';

const ISSUE_OPTIONS = [
  'Shifting', 'Brakes', 'Wheels', 'Suspension',
  'Drivetrain', 'Tune-up', 'New bike assembly', 'Other',
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';

const inp = {
  width: '100%', padding: '11px 13px', border: '1px solid #d1d5db',
  borderRadius: 10, fontSize: 15, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const section = { marginBottom: 20 };

function SuccessView({ booking, onBack }) {
  const link = BASE_URL + '/service/' + booking.id;
  const name = booking.name?.split(' ')[0] || 'your friend';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafaf7' }}>
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'calc(16px + env(safe-area-inset-top))',
        borderBottom: '1px solid #e5e7eb', background: '#fff',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8,
      }}>
        <div />
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#0f1a14' }}>
          Done
        </div>
        <div />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px 40px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1a3328', marginBottom: 10, lineHeight: 1.2 }}>
          We're on it.
        </div>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 6 }}>
          We'll reach out to {name} to confirm pickup.
        </p>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
          We sent you a confirmation too.
        </p>
        <a
          href={link}
          style={{
            display: 'block', width: '100%', padding: '13px 0',
            background: '#1a3328', color: '#fff', borderRadius: 12,
            textDecoration: 'none', fontSize: 15, fontWeight: 600, textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Track this booking
        </a>
        <button
          onClick={onBack}
          style={{
            display: 'block', width: '100%', padding: '13px 0',
            background: 'none', color: '#2d8653', border: '1px solid #d1fae5',
            borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

export default function PwaBookForFriend({ onBack }) {
  const profile = getProfile();
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [address, setAddress] = useState('');
  const [issues, setIssues] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  function toggleIssue(iss) {
    setIssues(prev => prev.includes(iss) ? prev.filter(x => x !== iss) : [...prev, iss]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!friendName.trim()) { setErr("Enter your friend's name."); return; }
    if (!friendPhone.trim()) { setErr("Enter your friend's phone number."); return; }
    if (issues.length === 0) { setErr('Select at least one issue.'); return; }

    setSubmitting(true);
    try {
      const bookerName = profile?.name || '';
      const bookerPhone = profile?.phone || '';
      const referred_by = bookerName + (bookerPhone ? ' (' + bookerPhone + ')' : '');

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: friendName.trim(),
          phone: friendPhone.trim(),
          address: address.trim() || null,
          issues,
          notes: notes.trim() || null,
          contact_preference: 'text',
          referred_by: referred_by || null,
          booker_phone: bookerPhone || null,
          booker_name: bookerName || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || 'Something went wrong. Try again.'); return; }
      saveBookingId(d.booking.id);
      setDone(d.booking);
    } catch {
      setErr('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <SuccessView booking={done} onBack={onBack} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafaf7' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'calc(16px + env(safe-area-inset-top))',
        borderBottom: '1px solid #e5e7eb', background: '#fff',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#2d8653', fontWeight: 600, padding: 0 }}
        >
          &larr; Home
        </button>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#0f1a14' }}>
          Book for a friend
        </div>
        <div />
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 48px' }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            Fill this out and we'll reach out to them directly — no app needed on their end.
          </p>

          <div style={section}>
            <label style={lbl}>Friend's name</label>
            <input
              type="text"
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="off"
              style={inp}
            />
          </div>

          <div style={section}>
            <label style={lbl}>Friend's phone</label>
            <input
              type="tel"
              value={friendPhone}
              onChange={e => setFriendPhone(e.target.value)}
              placeholder="(860) 555-1234"
              style={inp}
            />
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>
              We'll text them a pickup confirmation.
            </p>
          </div>

          <div style={section}>
            <label style={lbl}>Their address <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St, Anytown CT"
              style={inp}
            />
          </div>

          <div style={section}>
            <label style={lbl}>What's going on with their bike?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ISSUE_OPTIONS.map(iss => {
                const on = issues.includes(iss);
                return (
                  <button
                    key={iss}
                    type="button"
                    onClick={() => toggleIssue(iss)}
                    style={{
                      padding: '7px 14px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
                      fontFamily: 'inherit', background: on ? '#1a3328' : '#fff',
                      color: on ? '#fff' : '#374151',
                      border: on ? '2px solid #1a3328' : '1px solid #d1d5db',
                      fontWeight: on ? 600 : 400,
                    }}
                  >
                    {iss}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={section}>
            <label style={lbl}>Notes <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any other details — bike brand, specific problems, etc."
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {profile?.name && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#15803d' }}>
              Booked by {profile.name} — we'll send you a confirmation too.
            </div>
          )}

          {err && (
            <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{err}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '14px 0',
              background: submitting ? '#9ca3af' : '#1a3328',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 16, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Booking...' : 'Book it'}
          </button>
        </form>
      </div>
    </div>
  );
}
