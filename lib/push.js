import webpush from 'web-push';
import { supabaseAdmin } from './supabase';

const vapidReady = !!(
  process.env.VAPID_PRIVATE_KEY &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_SUBJECT
);

console.log('[push] VAPID status:', vapidReady ? 'configured' : 'NOT configured', {
  hasPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
  hasPublicKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  hasSubject: !!process.env.VAPID_SUBJECT,
});

if (vapidReady) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function pushToBooking(bookingId, payload) {
  console.log('[push] pushToBooking', bookingId, JSON.stringify(payload).slice(0, 120));

  if (!vapidReady) {
    console.error('[push] skipping — VAPID keys not configured (check VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_SUBJECT in Vercel env vars)');
    return;
  }
  if (!supabaseAdmin) {
    console.error('[push] skipping — supabaseAdmin unavailable');
    return;
  }

  const { data: subs, error: subErr } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .eq('booking_id', bookingId);

  if (subErr) {
    console.error('[push] error fetching subscriptions for', bookingId, ':', subErr.message);
    return;
  }

  console.log('[push]', subs?.length || 0, 'subscription(s) found for booking', bookingId);
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const expired = [];

  await Promise.all(subs.map(async sub => {
    const shortEndpoint = sub.endpoint.slice(0, 70) + '...';
    try {
      console.log('[push] sending to', shortEndpoint);
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
      console.log('[push] delivered to sub', sub.id);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log('[push] subscription expired (' + err.statusCode + '), queued for removal:', sub.id);
        expired.push(sub.id);
      } else {
        console.error('[push] send error for sub', sub.id,
          '— status:', err?.statusCode,
          '— message:', err?.message,
          '— body:', String(err?.body || '').slice(0, 200));
      }
    }
  }));

  if (expired.length) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', expired);
    console.log('[push] removed', expired.length, 'expired subscription(s)');
  }
}

export async function pushToAdmin(payload) {
  return pushToBooking('admin', payload);
}

export async function pushToPhone(phone, payload) {
  if (!phone) return;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 7) return;
  return pushToBooking(digits, payload);
}

export async function pushToAllCustomers(payload) {
  if (!vapidReady || !supabaseAdmin) return;

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .neq('booking_id', 'admin');

  if (error || !subs?.length) return;

  const body = JSON.stringify(payload);
  const expired = [];

  await Promise.all(subs.map(async sub => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) expired.push(sub.id);
    }
  }));

  if (expired.length) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', expired);
  }
}
