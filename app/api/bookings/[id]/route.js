import { supabaseAdmin } from '../../../../lib/supabase';
import {
  sendCancellationNotification,
  sendPickupConfirmedAdminEmail,
  sendDeliveryConfirmedAdminEmail,
} from '../../../../lib/email';
import { pushToAdmin } from '../../../../lib/push';

const VALID_STATUSES = [
  'new', 'confirmed', 'picked_up', 'in_progress', 'ready', 'out_for_delivery', 'complete', 'cancelled', 'no_show',
  // legacy values kept for backwards compat
  'booked', 'done', 'delivered',
];

// GET /api/bookings/[id]
export async function GET(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { id } = params;
  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });

  console.log('[GET /api/bookings/[id]] is_member:', data?.is_member, 'member_verified:', data?.member_verified);
  return Response.json({ booking: data });
}

// PATCH /api/bookings/[id]
export async function PATCH(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { id } = params;
  const body = await request.json();

  const allowed = ['status', 'notes', 'time_slot', 'preferred_day', 'dropoff',
                   'confirmed_date', 'confirmed_time', 'return_date', 'delivery_time', 'zone', 'preferred_time',
                   'invoice_amount', 'payment_link', 'receipt_url', 'address', 'member_verified',
                   'name', 'phone', 'email', 'last_notified_status',
                   'delivery_address', 'delivery_preferred_day', 'delivery_preferred_time',
                   'lat', 'lng', 'shop_photos', 'bikes', 'payment_status',
                   'estimate_amount', 'estimate_notes', 'estimate_photo',
                   'reminder_sent', 'confirmed_by_customer', 'customer_confirmed_at'];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (update.status && !VALID_STATUSES.includes(update.status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  console.log('[PATCH /api/bookings/' + id + '] full payload:', JSON.stringify(update));

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Notify admin when customer cancels
  if (update.status === 'cancelled') {
    sendCancellationNotification(data).catch(err =>
      console.error('[bookings/[id]] cancellation notification failed:', err?.message || err)
    );
    pushToAdmin({ title: (data.name || 'Customer') + ' cancelled', body: '', url: '/admin/service', tag: 'olo-admin' }).catch(() => {});
  }

  // Notify admin when customer confirms pickup
  if (update.confirmed_by_customer === true) {
    sendPickupConfirmedAdminEmail(data).catch(err =>
      console.error('[bookings/[id]] pickup confirmed admin email failed:', err?.message || err)
    );
    pushToAdmin({ title: (data.name || 'Customer') + ' confirmed pickup', body: '', url: '/admin/service', tag: 'olo-admin' }).catch(() => {});
  }

  // Notify admin when customer confirms delivery (day/time = final step of confirmation flow)
  if (update.delivery_preferred_day !== undefined && update.delivery_preferred_day) {
    sendDeliveryConfirmedAdminEmail(data).catch(err =>
      console.error('[bookings/[id]] delivery confirmed admin email failed:', err?.message || err)
    );
    const addr = data.delivery_address || '';
    const day = data.return_date || data.delivery_preferred_day || '';
    const t = data.delivery_time || data.delivery_preferred_time || '';
    pushToAdmin({ title: (data.name || 'Customer') + ' confirmed delivery', body: [addr, day, t ? 'around ' + t : ''].filter(Boolean).join(' · '), url: '/admin/service', tag: 'olo-admin' }).catch(() => {});
  }

  return Response.json({ booking: data });
}

// DELETE /api/bookings/[id]
export async function DELETE(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { id } = params;
  const { error } = await supabaseAdmin
    .from('service_bookings')
    .delete()
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
