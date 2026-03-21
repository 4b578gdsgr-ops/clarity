import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  const body = await request.json();
  const { message, email } = body;

  if (!message?.trim()) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  if (supabaseAdmin) {
    await supabaseAdmin.from('member_messages').insert([{
      message: message.trim(),
      email: email?.trim() || null,
    }]);
  }

  if (resend) {
    await resend.emails.send({
      from: 'One Love Outdoors <service@oneloveoutdoors.org>',
      to: ['service@oneloveoutdoors.org'],
      subject: 'New member message' + (email ? ' from ' + email : ''),
      text: message.trim() + (email ? '\n\nReply to: ' + email : '') + '\n\n— One Love Member Dashboard',
    }).catch(err => console.error('[member-messages] email failed:', err?.message));
  }

  return Response.json({ ok: true });
}
