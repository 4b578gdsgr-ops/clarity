import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  if (!resend) return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  const { to, subject, text } = await request.json();

  if (!to?.length || !subject?.trim() || !text?.trim()) {
    return Response.json({ error: 'to, subject, and text are required' }, { status: 400 });
  }

  const errors = [];
  for (const recipient of to) {
    try {
      await resend.emails.send({
        from: 'One Love Outdoors <service@oneloveoutdoors.org>',
        to: [recipient],
        subject,
        text,
      });
    } catch (err) {
      errors.push(recipient + ': ' + (err?.message || 'failed'));
    }
  }

  if (errors.length === to.length) {
    return Response.json({ error: 'All sends failed: ' + errors.join('; ') }, { status: 500 });
  }
  if (errors.length > 0) {
    return Response.json({ ok: true, warning: 'Some failed: ' + errors.join('; ') });
  }
  return Response.json({ ok: true });
}
