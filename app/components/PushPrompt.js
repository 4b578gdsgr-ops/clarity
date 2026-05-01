'use client';
import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getOrCreateSubscription() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return null;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }
  return sub;
}

async function saveSubscription(bookingId, sub) {
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId, subscription: sub.toJSON() }),
  });
}

export default function PushPrompt({ bookingId }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) return;

    const perm = Notification.permission;

    if (perm === 'granted' && bookingId) {
      (async () => {
        try {
          const sub = await getOrCreateSubscription();
          if (sub) await saveSubscription(bookingId, sub);
        } catch {}
      })();
      return;
    }

    if (perm !== 'default') return;

    try {
      if (localStorage.getItem('push_dismissed') === '1') return;
    } catch {}

    setShow(true);
  }, [bookingId]);

  async function handleEnable() {
    setShow(false);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      if (bookingId) {
        const sub = await getOrCreateSubscription();
        if (sub) await saveSubscription(bookingId, sub);
      }
    } catch {}
  }

  function handleDismiss() {
    setShow(false);
    try { localStorage.setItem('push_dismissed', '1'); } catch {}
  }

  if (!show) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
      padding: '10px 14px', marginBottom: 16,
    }}>
      <span style={{ fontSize: 14, color: '#166534' }}>Want updates on your phone?</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={handleEnable}
          style={{
            padding: '6px 14px', background: '#1a3328', color: '#fff', border: 'none',
            borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          }}
        >
          Enable notifications
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px', fontFamily: 'inherit',
          }}
        >
          &#215;
        </button>
      </div>
    </div>
  );
}
