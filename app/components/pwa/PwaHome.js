'use client';
import { useState, useEffect } from 'react';
import { getProfile } from '../../../lib/pwaProfile';
import { getSavedBookingIds } from '../../../lib/pwaBookings';
import dynamic from 'next/dynamic';

const PwaBookings = dynamic(() => import('./PwaBookings'));
const PwaMessages = dynamic(() => import('./PwaMessages'));
const PwaSettings = dynamic(() => import('./PwaSettings'));

function TabBar({ tab, setTab }) {
  const tabs = [
    { key: 'bookings', label: 'Bookings' },
    { key: 'messages', label: 'Messages' },
    { key: 'book',     label: 'Book' },
    { key: 'settings', label: 'Settings' },
  ];
  return (
    <div style={{
      display: 'flex', borderTop: '1px solid #e5e7eb', background: '#fff',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => {
            if (t.key === 'book') { window.location.href = '/schedule-service'; return; }
            setTab(t.key);
          }}
          style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontFamily: 'inherit', fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? '#1a3328' : '#9ca3af',
            borderTop: tab === t.key ? '2px solid #1a3328' : '2px solid transparent',
            marginTop: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function HomeTab({ profile }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#fafaf7' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 20px 32px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: '#1a3328', marginBottom: 8, lineHeight: 1.1 }}>
          Hey {profile?.name?.split(' ')[0] || 'there'}.
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
          What do you need today?
        </p>
        <a
          href="/schedule-service"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #2d8653, #1a6e3f)',
            borderRadius: 14, padding: '20px 20px', textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(45,134,83,0.18)',
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Book service</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Pickup Monday. Back by Friday.</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>&rsaquo;</div>
        </a>
      </div>
    </div>
  );
}

export default function PwaHome({ onResetProfile }) {
  const profile = getProfile();
  const [tab, setTab] = useState('bookings');

  useEffect(() => {
    console.log('[PWA] PwaHome mounted — profile:', profile?.name, '| savedIds:', getSavedBookingIds());
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fafaf7' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'home'     && <HomeTab profile={profile} />}
        {tab === 'bookings' && <PwaBookings profile={profile} onShowHome={() => setTab('home')} />}
        {tab === 'messages' && <PwaMessages profile={profile} />}
        {tab === 'settings' && <PwaSettings profile={profile} onDone={() => setTab('home')} onResetProfile={onResetProfile} />}
      </div>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}
