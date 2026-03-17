import { supabaseAdmin } from '../../../lib/supabase';

// GET /api/messages?booking_id=xxx
export async function GET(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const booking_id = searchParams.get('booking_id');
  if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('service_messages')
    .select('*')
    .eq('booking_id', booking_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[messages] GET error:', error.message, { booking_id });
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ messages: data });
}

// POST /api/messages
export async function POST(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const body = await request.json();
  const { booking_id, sender, body: text } = body;

  if (!booking_id || !sender || !text?.trim()) {
    return Response.json({ error: 'booking_id, sender, and body are required' }, { status: 400 });
  }
  if (!['customer', 'admin'].includes(sender)) {
    return Response.json({ error: 'sender must be customer or admin' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_messages')
    .insert([{ booking_id, sender, message: text.trim() }])
    .select()
    .single();

  if (error) {
    console.error('[messages] POST insert error:', error.message, { booking_id, sender });
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ message: data }, { status: 201 });
}
