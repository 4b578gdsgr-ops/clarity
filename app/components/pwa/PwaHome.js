'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getProfile } from '../../../lib/pwaProfile';
import { getSavedBookingIds } from '../../../lib/pwaBookings';
import {
  markBookingsViewed, markMessagesSeen,
  countUnreadBookings, countUnreadMessages,
} from '../../../lib/pwaBadges';
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

function Badge({ count }) {
  if (!count || count < 1) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box',
      background: '#dc2626', color: '#fff', borderRadius: 10,
      fontSize: 11, fontWeight: 700, lineHeight: '20px', flexShrink: 0,
    }}>
      {count > 99 ? '99+' : count}
    </span>
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

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function PushPrompt({ phone, onDone }) {
  async function handleEnable() {
    onDone();
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const digits = String(phone || '').replace(/\D/g, '');
      if (digits.length >= 7) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: digits, subscription: sub.toJSON() }),
        });
      }
    } catch (err) {
      console.error('[push] subscription failed:', err);
    }
  }

  function handleDismiss() {
    onDone();
    let state = {};
    try { state = JSON.parse(localStorage.getItem('ol_push_prompt') || '{}'); } catch {}
    const dismissals = (state.dismissals || 0) + 1;
    const nextPrompt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('ol_push_prompt', JSON.stringify({ dismissals, nextPrompt }));
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '14px 16px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1a14', marginBottom: 4 }}>
        Enable notifications
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
        Get notified when your bike is ready or we send you a message.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleEnable}
          style={{
            flex: 1, padding: '9px 0', background: '#1a3328', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          style={{
            flex: 1, padding: '9px 0', background: 'none', color: '#6b7280',
            border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export default function PwaHome({ onResetProfile }) {
  const profile = getProfile();
  const [view, setView] = useState('home');
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [bookingBadge, setBookingBadge] = useState(0);
  const [messageBadge, setMessageBadge] = useState(0);
  // Track current view in a ref so the poll callback always sees the latest value
  const viewRef = useRef('home');
  const profileRef = useRef(profile);

  function updateView(v) {
    viewRef.current = v;
    setView(v);
  }

  // Fetch both badge counts and update state (skips if that tab is already open)
  const refreshBadges = useCallback(async () => {
    const p = profileRef.current;
    const ids = getSavedBookingIds();
    const bParams = new URLSearchParams();
    if (p?.phone) bParams.set('phone', p.phone);
    if (ids.length) bParams.set('ids', ids.join(','));

    if (bParams.toString()) {
      try {
        const res = await fetch('/api/my-bookings?' + bParams.toString());
        const d = await res.json();
        if (d.bookings) {
          const count = viewRef.current === 'bookings' ? 0 : countUnreadBookings(d.bookings);
          setBookingBadge(count);
        }
      } catch {}
    }

    if (p?.phone) {
      try {
        const res = await fetch('/api/pwa/messages?phone=' + encodeURIComponent(p.phone));
        const d = await res.json();
        if (d.messages) {
          const count = viewRef.current === 'messages' ? 0 : countUnreadMessages(d.messages);
          setMessageBadge(count);
        }
      } catch {}
    }
  }, []);

  // Mount: handle deep-link, initial badge fetch, 30s poll
  useEffect(() => {
    profileRef.current = profile;

    // Handle ?openTab= deep-link from push notification
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('openTab');
    if (tab && ['bookings', 'messages', 'rides', 'settings'].includes(tab)) {
      window.history.replaceState({}, '', window.location.pathname);
      openTab(tab);
    }

    refreshBadges();
    const interval = setInterval(refreshBadges, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push prompt: show 800ms after returning to home, if eligible
  useEffect(() => {
    if (view !== 'home') return;
    if (!('Notification' in window) || !VAPID_PUBLIC_KEY) return;
    if (Notification.permission !== 'default') return;
    if (!profile?.phone) return;
    let state = {};
    try { state = JSON.parse(localStorage.getItem('ol_push_prompt') || '{}'); } catch {}
    if ((state.dismissals || 0) >= 2) return;
    if (Date.now() < (state.nextPrompt || 0)) return;
    const t = setTimeout(() => setShowPushPrompt(true), 800);
    return () => clearTimeout(t);
  }, [view, profile?.phone]);

  function openTab(tab) {
    if (tab === 'bookings') {
      markBookingsViewed();
      setBookingBadge(0);
    } else if (tab === 'messages') {
      markMessagesSeen();
      setMessageBadge(0);
    }
    updateView(tab);
  }

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
              onClick={() => openTab('settings')}
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

              {showPushPrompt && (
                <PushPrompt phone={profile?.phone} onDone={() => setShowPushPrompt(false)} />
              )}

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
                  onClick={() => openTab('bookings')}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge count={bookingBadge} />
                    <div style={{ color: '#9ca3af', fontSize: 22 }}>&rsaquo;</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openTab('messages')}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge count={messageBadge} />
                    <div style={{ color: '#9ca3af', fontSize: 22 }}>&rsaquo;</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openTab('rides')}
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
          {view === 'bookings' && <PwaBookings profile={profile} onBack={() => updateView('home')} />}
          {view === 'messages' && <PwaMessages profile={profile} onBack={() => updateView('home')} />}
          {view === 'rides'    && <PwaRides onBack={() => updateView('home')} />}
          {view === 'settings' && <PwaSettings profile={profile} onDone={() => updateView('home')} onResetProfile={onResetProfile} />}
        </div>
      )}
    </div>
  );
}
