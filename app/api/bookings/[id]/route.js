import { supabaseAdmin } from '../../../../lib/supabase';
import { notifyCustomer, notifyCustomerQuote } from '../../../../lib/notify';
import { sendCancellationNotification } from '../../../../lib/email';
import { pushToBooking, pushToAdmin, pushToPhone } from '../../../../lib/push';

const PUSH_PAYLOADS = {
  confirmed: {
    title: 'Your bike: confirmed',
    body: "We've got your request. We'll be in touch to set up pickup.",
  },
  in_progress: {
    title: 'Your bike: in progress',
    body: "Your bike is on the stand — we're working on it.",
  },
  ready: {
    title: 'Your bike: ready',
    body: "All done. We'll have it back to you soon.",
  },
  out_for_delivery: {
    title: 'Your bike: out for delivery',
    body: 'Your bike is heading back to you.',
  },
  complete: {
    title: 'Your bike: complete',
    body: 'Service is complete. Thanks for riding with us.',
  },
};

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
  const { skip_notification, send_quote } = body;

  const allowed = ['status', 'notes', 'time_slot', 'preferred_day',
                   'confirmed_date', 'confirmed_time', 'return_date', 'delivery_time', 'zone', 'preferred_time',
                   'invoice_amount', 'payment_link', 'address', 'member_verified',
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

  console.log('[PATCH /api/bookings/' + id + '] full payload:', JSON.stringify(update));

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Send quote notification if requested
  if (send_quote) {
    const pref = data.contact_preference;
    if (pref !== 'text' && pref !== 'phone') {
      notifyCustomerQuote(data).catch(err =>
        console.error('[bookings/[id]] quote notification failed:', err?.message || err)
      );
    }
    // text/phone: admin handles manually — no auto-notification
  }

  // Notify customer on confirmed and ready only — skip_notification suppresses this for backward moves
  const NOTIFY_TRIGGERS = new Set(['confirmed', 'ready']);
  if (update.status && NOTIFY_TRIGGERS.has(update.status) && !skip_notification) {
    const pref = data.contact_preference;
    if (pref !== 'text' && pref !== 'phone') {
      // Email preference: send automatically, then mark as notified
      notifyCustomer(update.status, data).catch(err =>
        console.error('[bookings/[id]] notification failed for', update.status, ':', err?.message || err)
      );
      await supabaseAdmin
        .from('service_bookings')
        .update({ last_notified_status: update.status })
        .eq('id', id);
      data.last_notified_status = update.status;
    }
    // text/phone: no auto-notification — admin sees NEEDS TEXT badge and copies manually
  }

  // Push notification for key status changes (sent regardless of contact_preference)
  const PUSH_STATUSES = new Set(['confirmed', 'in_progress', 'ready', 'out_for_delivery', 'complete']);
  if (update.status && PUSH_STATUSES.has(update.status) && !skip_notification) {
    const push = PUSH_PAYLOADS[update.status];
    const pushPayload = { ...push, url: '/service/' + id, tag: 'olo-status' };
    pushToBooking(id, pushPayload).catch(err =>
      console.error('[bookings/[id]] push failed for', update.status, ':', err?.message || err)
    );
    if (data.phone) {
      pushToPhone(data.phone, pushPayload).catch(err =>
        console.error('[bookings/[id]] phone push failed for', update.status, ':', err?.message || err)
      );
    }
  }

  // Notify admin when customer cancels
  if (update.status === 'cancelled' && !skip_notification) {
    sendCancellationNotification(data).catch(err =>
      console.error('[bookings/[id]] cancellation notification failed:', err?.message || err)
    );
    pushToAdmin({ title: (data.name || 'Customer') + ' cancelled', body: '', url: '/admin/service', tag: 'olo-admin' }).catch(() => {});
  }

  // Push admin when customer confirms pickup
  if (update.confirmed_by_customer === true) {
    pushToAdmin({ title: (data.name || 'Customer') + ' confirmed pickup', body: '', url: '/admin/service', tag: 'olo-admin' }).catch(() => {});
  }

  // Push admin when customer sets delivery address
  if (update.delivery_address !== undefined) {
    pushToAdmin({ title: (data.name || 'Customer') + ' confirmed delivery', body: update.delivery_address || '', url: '/admin/service', tag: 'olo-admin' }).catch(() => {});
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
