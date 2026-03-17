import { supabaseAdmin } from '../../../../lib/supabase';
import { sendServiceEmail } from '../../../../lib/email';

const VALID_STATUSES = [
  'new', 'confirmed', 'picked_up', 'in_progress', 'done', 'cancelled',
  // legacy values kept for backwards compat
  'booked', 'ready', 'delivered',
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

  return Response.json({ booking: data });
}

// PATCH /api/bookings/[id]
export async function PATCH(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { id } = params;
  const body = await request.json();

  const allowed = ['status', 'notes', 'time_slot', 'preferred_day',
                   'confirmed_date', 'confirmed_time', 'return_date', 'zone', 'preferred_time'];
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

  // Send email when status advances to a customer-facing milestone
  const EMAIL_TRIGGERS = new Set(['confirmed', 'picked_up', 'done']);
  if (update.status && EMAIL_TRIGGERS.has(update.status)) {
    sendServiceEmail(update.status, data).catch(() => {});
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
