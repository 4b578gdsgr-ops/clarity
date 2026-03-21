import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  if (!resend) return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  const { to, subject, text } = await request.json();

  if (!to?.length || !subject?.trim() || !text?.trim()) {
    return Response.json({ error: 'to, subject, and text are required' }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: 'One Love Outdoors <service@oneloveoutdoors.org>',
      to,
      subject,
      text,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err?.message || 'Send failed' }, { status: 500 });
  }
}
