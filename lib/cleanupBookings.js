import { supabaseAdmin } from './supabase';

function extractStoragePath(url) {
  if (!url) return null;
  const marker = '/booking-photos/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

export async function runCleanup() {
  if (!supabaseAdmin) throw new Error('Admin client unavailable');

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings, error: bErr } = await supabaseAdmin
    .from('service_bookings')
    .select('id, shop_photos, estimate_photo, photos')
    .in('status', ['complete', 'done', 'delivered', 'cancelled'])
    .lt('created_at', cutoff);

  if (bErr) throw new Error(bErr.message);
  if (!bookings || bookings.length === 0) return 0;

  const bookingIds = bookings.map(b => b.id);

  // Collect storage paths from booking-level photo fields
  const photoPaths = [];
  for (const b of bookings) {
    for (const url of (b.shop_photos || [])) {
      const p = extractStoragePath(url); if (p) photoPaths.push(p);
    }
    const ep = extractStoragePath(b.estimate_photo); if (ep) photoPaths.push(ep);
    for (const url of (b.photos || [])) {
      const p = extractStoragePath(url); if (p) photoPaths.push(p);
    }
  }

  // Collect storage paths from inspection item photos/videos
  const { data: inspections } = await supabaseAdmin
    .from('inspection_reports')
    .select('items')
    .in('booking_id', bookingIds);

  for (const insp of (inspections || [])) {
    for (const item of (insp.items || [])) {
      const p = extractStoragePath(item.photo); if (p) photoPaths.push(p);
    }
  }

  // Delete storage objects (ignore errors — files may already be gone)
  if (photoPaths.length > 0) {
    await supabaseAdmin.storage.from('booking-photos').remove(photoPaths);
  }

  // Delete related rows, then the bookings themselves
  await supabaseAdmin.from('inspection_reports').delete().in('booking_id', bookingIds);
  await supabaseAdmin.from('service_messages').delete().in('booking_id', bookingIds);
  await supabaseAdmin.from('service_bookings').delete().in('id', bookingIds);

  return bookings.length;
}
