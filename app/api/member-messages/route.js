import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  const body = await request.json();
  const { name, message, email } = body;

  if (!name?.trim() || !message?.trim()) {
    return Response.json({ error: 'Name and message are required' }, { status: 400 });
  }

  if (supabaseAdmin) {
    await supabaseAdmin.from('member_messages').insert([{
      name: name.trim(),
      message: message.trim(),
      email: email?.trim() || null,
    }]);
  }

  if (resend) {
    await resend.emails.send({
      from: 'One Love Outdoors <service@oneloveoutdoors.org>',
      to: ['service@oneloveoutdoors.org'],
      subject: 'Member message — ' + name.trim(),
      text: message.trim() + '\n\nFrom: ' + name.trim() + (email ? '\nReply to: ' + email.trim() : '') + '\n\n— One Love Member Dashboard',
    }).catch(err => console.error('[member-messages] email failed:', err?.message));
  }

  return Response.json({ ok: true });
}
