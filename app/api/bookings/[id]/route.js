import { supabaseAdmin } from '../../../../lib/supabase';
import { notifyCustomer } from '../../../../lib/notify';

const VALID_STATUSES = [
  'new', 'confirmed', 'picked_up', 'in_progress', 'ready', 'out_for_delivery', 'complete', 'cancelled',
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

  const allowed = ['status', 'notes', 'time_slot', 'preferred_day',
                   'confirmed_date', 'confirmed_time', 'return_date', 'delivery_time', 'zone', 'preferred_time',
                   'invoice_amount', 'payment_link', 'address', 'member_verified',
                   'name', 'phone', 'email'];
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

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Notify customer (SMS or email) when status advances to a customer-facing milestone
  const NOTIFY_TRIGGERS = new Set(['confirmed', 'in_progress', 'ready', 'out_for_delivery', 'complete']);
  if (update.status && NOTIFY_TRIGGERS.has(update.status)) {
    notifyCustomer(update.status, data).catch(err =>
      console.error('[bookings/[id]] notification failed for', update.status, ':', err?.message || err)
    );
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
