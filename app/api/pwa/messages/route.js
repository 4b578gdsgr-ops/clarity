import { supabaseAdmin } from '../../../../lib/supabase';
import { pushToAdmin } from '../../../../lib/push';
import { sendAdminMessageNotification } from '../../../../lib/email';

function normalizePhone(p) {
  return (p || '').replace(/\D/g, '');
}

async function getBookingsForPhone(digits) {
  const { data } = await supabaseAdmin
    .from('service_bookings')
    .select('id, name, phone, status, created_at')
    .order('created_at', { ascending: false });
  return (data || []).filter(b => normalizePhone(b.phone) === digits);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  if (!phone) return Response.json({ error: 'phone required' }, { status: 400 });

  const digits = normalizePhone(phone);
  if (digits.length < 7) return Response.json({ error: 'invalid phone' }, { status: 400 });

  const bookings = await getBookingsForPhone(digits);
  if (!bookings.length) return Response.json({ messages: [], canMessage: false });

  const bookingIds = bookings.map(b => b.id);
  const { data: messages, error } = await supabaseAdmin
    .from('service_messages')
    .select('*')
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const active = bookings.find(b => !['cancelled', 'no_show', 'complete'].includes(b.status));
  return Response.json({ messages: messages || [], canMessage: true, activeBookingId: active?.id || bookings[0]?.id });
}

export async function POST(req) {
  const { phone, name, message } = await req.json();
  if (!phone || !message?.trim()) {
    return Response.json({ error: 'phone and message required' }, { status: 400 });
  }

  const digits = normalizePhone(phone);
  const bookings = await getBookingsForPhone(digits);
  if (!bookings.length) {
    return Response.json({ error: 'No bookings found for this phone number' }, { status: 404 });
  }

  const active = bookings.find(b => !['cancelled', 'no_show', 'complete'].includes(b.status));
  const bookingId = active?.id || bookings[0].id;
  const bookingName = active?.name || bookings[0]?.name || name;

  const { data, error } = await supabaseAdmin
    .from('service_messages')
    .insert([{ booking_id: bookingId, sender: 'customer', message: message.trim() }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  sendAdminMessageNotification({ name: bookingName, bike_brand: '' }, message.trim()).catch(() => {});
  pushToAdmin({
    title: 'Message from ' + (bookingName || name || 'customer'),
    body: message.trim().slice(0, 80),
    url: '/admin/service',
    tag: 'olo-admin-msg',
  }).catch(() => {});

  return Response.json({ message: data }, { status: 201 });
}
