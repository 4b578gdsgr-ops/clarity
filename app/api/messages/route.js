import { supabaseAdmin } from '../../../lib/supabase';
import { sendAdminMessageNotification } from '../../../lib/email';
import { notifyCustomerMessage } from '../../../lib/notify';

// GET /api/messages?booking_id=xxx
export async function GET(request) {
  console.log('[messages] GET called');

  if (!supabaseAdmin) {
    console.error('[messages] GET: supabaseAdmin is null — SUPABASE_SERVICE_ROLE_KEY missing?');
    return Response.json({ error: 'Admin client unavailable' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const booking_id = searchParams.get('booking_id');
  console.log('[messages] GET booking_id:', booking_id);

  if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('service_messages')
    .select('*')
    .eq('booking_id', booking_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[messages] GET supabase error:', JSON.stringify(error));
    return Response.json({ error: error.message, code: error.code }, { status: 500 });
  }

  console.log('[messages] GET returning', data?.length, 'messages');
  return Response.json({ messages: data });
}

// POST /api/messages
// Body: { booking_id, sender: 'admin'|'customer', message }
export async function POST(request) {
  console.log('[messages] POST called');

  if (!supabaseAdmin) {
    console.error('[messages] POST: supabaseAdmin is null — SUPABASE_SERVICE_ROLE_KEY missing?');
    return Response.json({ error: 'Admin client unavailable' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('[messages] POST: failed to parse request body:', e.message);
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { booking_id, sender, message } = body;
  console.log('[messages] POST body:', { booking_id, sender, message_length: message?.length });

  if (!booking_id || !sender || !message?.trim()) {
    console.error('[messages] POST: validation failed', { booking_id, sender, has_message: !!message });
    return Response.json({ error: 'booking_id, sender, and message are required' }, { status: 400 });
  }
  if (!['customer', 'admin'].includes(sender)) {
    console.error('[messages] POST: invalid sender:', sender);
    return Response.json({ error: 'sender must be customer or admin' }, { status: 400 });
  }

  const insertPayload = { booking_id, sender, message: message.trim() };
  console.log('[messages] POST inserting:', insertPayload);

  const { data, error } = await supabaseAdmin
    .from('service_messages')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('[messages] POST supabase insert error:', JSON.stringify(error));
    return Response.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }

  console.log('[messages] POST insert succeeded, id:', data?.id);

  // Fire-and-forget notification emails
  if (sender === 'admin') {
    // Notify the customer (SMS or email based on contact_preference)
    const { data: booking, error: bErr } = await supabaseAdmin
      .from('service_bookings')
      .select('id, name, email, phone, contact_preference')
      .eq('id', booking_id)
      .single();
    if (bErr) {
      console.error('[messages] POST: failed to fetch booking for notification:', bErr.message);
    } else if (booking) {
      notifyCustomerMessage(booking, message.trim()).catch(err =>
        console.error('[messages] POST customer notification failed:', err?.message || err)
      );
    }
  } else if (sender === 'customer') {
    // Email the admin
    const { data: booking, error: bErr } = await supabaseAdmin
      .from('service_bookings')
      .select('name, bike_brand, issues')
      .eq('id', booking_id)
      .single();
    if (bErr) {
      console.error('[messages] POST: failed to fetch booking for admin email:', bErr.message);
    } else if (booking) {
      sendAdminMessageNotification(booking, message.trim()).catch(err =>
        console.error('[messages] POST admin email failed:', err?.message || err)
      );
    }
  }

  return Response.json({ message: data }, { status: 201 });
}

// DELETE /api/messages?booking_id=xxx — clears all messages for a booking
export async function DELETE(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const booking_id = searchParams.get('booking_id');
  if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('service_messages')
    .delete()
    .eq('booking_id', booking_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
