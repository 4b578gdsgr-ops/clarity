import webpush from 'web-push';
import { supabaseAdmin } from './supabase';

const vapidReady = !!(
  process.env.VAPID_PRIVATE_KEY &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_SUBJECT
);

if (vapidReady) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function pushToBooking(bookingId, payload) {
  if (!vapidReady || !supabaseAdmin) return;

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .eq('booking_id', bookingId);

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const expired = [];

  await Promise.all(subs.map(async sub => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        expired.push(sub.id);
      } else {
        console.error('[push] send failed for sub', sub.id, ':', err?.message);
      }
    }
  }));

  if (expired.length) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', expired);
  }
}
