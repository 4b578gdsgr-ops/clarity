import { supabaseAdmin } from '../../../../../lib/supabase';
import { sendReminderEmail } from '../../../../../lib/email';

export async function POST(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { id } = params;

  const { data: booking, error } = await supabaseAdmin
    .from('service_bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

  const pref = booking.contact_preference;
  const isText = pref === 'text' || pref === 'phone';

  // Mark reminder sent
  await supabaseAdmin
    .from('service_bookings')
    .update({ reminder_sent: true })
    .eq('id', id);

  if (isText) {
    // Return SMS copy text — admin copies manually
    const firstName = (booking.name || 'there').split(' ')[0];
    const time = booking.confirmed_time
      ? ' around ' + fmtTime(booking.confirmed_time)
      : '';
    const smsText = `Hi ${firstName}, confirming pickup tomorrow${time}. Still good? Reply YES or let us know if anything changed. — One Love`;
    return Response.json({ type: 'sms', smsText });
  }

  // Email customer
  if (!booking.email) return Response.json({ error: 'No email on file' }, { status: 400 });
  await sendReminderEmail(booking);
  return Response.json({ type: 'email' });
}

function fmtTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM');
}
