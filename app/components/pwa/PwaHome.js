'use client';
import { useState } from 'react';
import { getProfile } from '../../../lib/pwaProfile';
import dynamic from 'next/dynamic';

const PwaMessages = dynamic(() => import('./PwaMessages'));
const PwaBookings = dynamic(() => import('./PwaBookings'));
const PwaSettings = dynamic(() => import('./PwaSettings'));

export default function PwaHome({ onResetProfile }) {
  const [view, setView] = useState('home');
  const profile = getProfile();

  if (view === 'messages') return <PwaMessages profile={profile} onBack={() => setView('home')} />;
  if (view === 'bookings') return <PwaBookings profile={profile} onBack={() => setView('home')} />;
  if (view === 'settings') return <PwaSettings profile={profile} onDone={() => setView('home')} onResetProfile={onResetProfile} />;

  return (
    <div style={{ minHeight: '100dvh', background: '#fafaf7' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 20px 32px' }}>

        {/* Greeting + settings */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: '#1a3328', margin: 0, lineHeight: 1.1 }}>
              Hey {profile?.name?.split(' ')[0] || 'there'}.
            </h1>
          </div>
          <button
            onClick={() => setView('settings')}
            aria-label="Settings"
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1, marginTop: 4 }}
          >
            &#9881;
          </button>
        </div>

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Book service */}
          <a
            href="/schedule-service"
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #2d8653, #1a6e3f)',
              borderRadius: 14, padding: '18px 20px', textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(45,134,83,0.18)',
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Book service</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Pickup Monday. Back by Friday.</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>&rsaquo;</div>
          </a>

          {/* Messages */}
          <button
            onClick={() => setView('messages')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit', width: '100%',
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1a14', marginBottom: 3 }}>Messages</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Chat with your mechanic</div>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 20 }}>&rsaquo;</div>
          </button>

          {/* My bookings */}
          <button
            onClick={() => setView('bookings')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit', width: '100%',
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1a14', marginBottom: 3 }}>My bookings</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Active and past service</div>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 20 }}>&rsaquo;</div>
          </button>
        </div>

      </div>
    </div>
  );
}
