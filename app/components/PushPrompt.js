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
  if (!key) {
    console.warn('[PushPrompt] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — cannot create push subscription');
    return null;
  }
  const reg = await navigator.serviceWorker.ready;
  console.log('[PushPrompt] SW ready, getting existing subscription...');
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    console.log('[PushPrompt] existing subscription found:', sub.endpoint.slice(0, 70) + '...');
  } else {
    console.log('[PushPrompt] no existing subscription, creating new one...');
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    console.log('[PushPrompt] new subscription created:', sub.endpoint.slice(0, 70) + '...');
  }
  return sub;
}

async function saveSubscription(bookingId, sub) {
  const subJson = sub.toJSON();
  console.log('[PushPrompt] saving subscription to Supabase', {
    bookingId,
    endpoint: subJson.endpoint?.slice(0, 70) + '...',
    hasP256dh: !!subJson.keys?.p256dh,
    hasAuth: !!subJson.keys?.auth,
  });
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId, subscription: subJson }),
  });
  const data = await res.json();
  console.log('[PushPrompt] save response:', res.status, data);
  if (!res.ok) throw new Error(data.error || 'Save failed');
}

export default function PushPrompt({ bookingId }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show in standalone PWA mode — not in regular browser or iframe
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const notifSupported = 'Notification' in window;
    const swSupported = 'serviceWorker' in navigator;
    const pushSupported = 'PushManager' in window;
    let dismissed = false;
    try { dismissed = localStorage.getItem('push_dismissed') === '1'; } catch {}

    console.log('[PushPrompt]', {
      isStandalone,
      notifSupported,
      swSupported,
      pushSupported,
      vapidKeySet: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      permission: notifSupported ? Notification.permission : 'n/a',
      dismissed,
      bookingId: bookingId || null,
    });

    // Only proceed in PWA standalone mode
    if (!isStandalone) return;
    if (!notifSupported || !swSupported || !pushSupported) return;

    const perm = Notification.permission;

    if (perm === 'granted' && bookingId) {
      // Already have permission — silently subscribe for this booking
      (async () => {
        try {
          const sub = await getOrCreateSubscription();
          if (sub) await saveSubscription(bookingId, sub);
        } catch (err) {
          console.error('[PushPrompt] silent subscribe error:', err?.message);
        }
      })();
      return;
    }

    if (perm !== 'default') return; // denied — don't ask again
    if (dismissed) return;

    setShow(true);
  }, [bookingId]);

  async function handleEnable() {
    setShow(false);
    try {
      console.log('[PushPrompt] requesting notification permission...');
      const perm = await Notification.requestPermission();
      console.log('[PushPrompt] permission result:', perm);
      if (perm !== 'granted') return;
      if (bookingId) {
        const sub = await getOrCreateSubscription();
        if (sub) await saveSubscription(bookingId, sub);
      }
    } catch (err) {
      console.error('[PushPrompt] enable error:', err?.message);
    }
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
