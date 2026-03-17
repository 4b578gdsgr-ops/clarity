import { supabaseAdmin } from '../../../../lib/supabase';

// GET /api/messages/unread
// Returns { total: N, counts: { [booking_id]: N } } for all unread customer messages
export async function GET() {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('service_messages')
    .select('booking_id')
    .eq('sender', 'customer')
    .eq('unread', true);

  if (error) {
    console.error('[messages/unread] GET error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const counts = {};
  for (const row of (data || [])) {
    counts[row.booking_id] = (counts[row.booking_id] || 0) + 1;
  }

  return Response.json({ total: data?.length || 0, counts });
}

// PATCH /api/messages/unread
// Body: { booking_id } — marks all unread customer messages for that booking as read
export async function PATCH(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { booking_id } = await request.json();
  if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('service_messages')
    .update({ unread: false })
    .eq('booking_id', booking_id)
    .eq('sender', 'customer')
    .eq('unread', true);

  if (error) {
    console.error('[messages/unread] PATCH error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
