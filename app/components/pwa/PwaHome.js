'use client';
import { useState, useEffect } from 'react';
import { getProfile } from '../../../lib/pwaProfile';
import { getSavedBookingIds } from '../../../lib/pwaBookings';
import dynamic from 'next/dynamic';

const PwaBookings = dynamic(() => import('./PwaBookings'));
const PwaMessages = dynamic(() => import('./PwaMessages'));
const PwaSettings = dynamic(() => import('./PwaSettings'));
const PwaRides = dynamic(() => import('./PwaRides'));

const ACTIVE_STATUSES = new Set(['new', 'confirmed', 'picked_up', 'in_progress', 'ready', 'out_for_delivery']);
const STATUS_VERB = {
  new: 'submitted',
  confirmed: 'confirmed',
  picked_up: 'picked up',
  in_progress: 'in progress',
  ready: 'ready for pickup',
  out_for_delivery: 'out for delivery',
};

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function ActiveBanner({ profile }) {
  const [booking, setBooking] = useState(undefined);

  useEffect(() => {
    const ids = getSavedBookingIds();
    const params = new URLSearchParams();
    if (profile?.phone) params.set('phone', profile.phone);
    if (ids.length) params.set('ids', ids.join(','));
    if (!params.toString()) { setBooking(null); return; }

    fetch('/api/my-bookings?' + params.toString())
      .then(r => r.json())
      .then(d => {
        if (d.bookings) {
          setBooking(d.bookings.find(b => ACTIVE_STATUSES.has(b.status)) || null);
        } else {
          setBooking(null);
        }
      })
      .catch(() => setBooking(null));
  }, [profile?.phone]);

  if (!booking) return null;

  const brand = booking.bikes?.[0]?.brand || booking.bike_brand;
  const label = brand || 'Your bike';
  const verb = STATUS_VERB[booking.status] || booking.status;

  return (
    <a
      href={'/service/' + booking.id}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
        padding: '12px 16px', textDecoration: 'none', marginBottom: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Active service</div>
        <div style={{ fontSize: 14, color: '#0f1a14', fontWeight: 500 }}>{label} &mdash; {verb}</div>
      </div>
      <div style={{ color: '#16a34a', fontSize: 20 }}>&rsaquo;</div>
    </a>
  );
}

export default function PwaHome({ onResetProfile }) {
  const profile = getProfile();
  const [view, setView] = useState('home');

  useEffect(() => {
    console.log('[PWA] PwaHome mounted — profile:', profile?.name, '| savedIds:', getSavedBookingIds());
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fafaf7' }}>
      {view === 'home' && (
        <>
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            padding: '12px 16px 0',
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
            background: '#fafaf7',
          }}>
            <button
              onClick={() => setView('settings')}
              aria-label="Settings"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af', lineHeight: 1 }}
            >
              <GearIcon />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 40px' }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: '#1a3328', marginBottom: 8, lineHeight: 1.1 }}>
                Hey {profile?.name?.split(' ')[0] || 'there'}.
              </h1>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>What do you need today?</p>

              <ActiveBanner profile={profile} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href="/schedule-service"
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, #2d8653, #1a6e3f)',
                    borderRadius: 14, padding: '18px 20px', textDecoration: 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Book service</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Pickup Monday. Back by Friday.</div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>&rsaquo;</div>
                </a>

                <button
                  type="button"
                  onClick={() => setView('bookings')}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                    padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f1a14', marginBottom: 2 }}>My bookings</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>View past and active services.</div>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 22 }}>&rsaquo;</div>
                </button>

                <button
                  type="button"
                  onClick={() => setView('messages')}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                    padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f1a14', marginBottom: 2 }}>Messages</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Talk to your mechanic.</div>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 22 }}>&rsaquo;</div>
                </button>

                <button
                  type="button"
                  onClick={() => setView('rides')}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                    padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f1a14', marginBottom: 2 }}>Rides</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Upcoming group rides.</div>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 22 }}>&rsaquo;</div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {view !== 'home' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'bookings' && <PwaBookings profile={profile} onBack={() => setView('home')} />}
          {view === 'messages' && <PwaMessages profile={profile} onBack={() => setView('home')} />}
          {view === 'rides'    && <PwaRides onBack={() => setView('home')} />}
          {view === 'settings' && <PwaSettings profile={profile} onDone={() => setView('home')} onResetProfile={onResetProfile} />}
        </div>
      )}
    </div>
  );
}
