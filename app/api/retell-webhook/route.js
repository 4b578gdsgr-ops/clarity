import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';
import { pushToAdmin } from '../../../lib/push';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = 'service@oneloveoutdoors.org';
const FROM = 'One Love Outdoors <service@oneloveoutdoors.org>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';
const SCHEDULE_URL = 'https://oneloveoutdoors.org/schedule-service-app';

function extractCallData(body) {
  // Retell sends { event, call: { ... } }
  const call = body?.call || body;
  const analysis = call?.call_analysis || {};
  const custom = analysis?.custom_analysis_data || call?.retell_llm_dynamic_variables || {};

  const name = custom?.name || custom?.caller_name || null;
  const phone = custom?.phone || custom?.caller_phone || call?.from_number || null;
  const email = custom?.email || custom?.caller_email || null;
  const summary = analysis?.call_summary || custom?.summary || null;
  const transcript = call?.transcript || null;
  const callType = custom?.call_type || custom?.type || null; // 'service', 'personal', 'junk'

  return { name, phone, email, summary, transcript, callType };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[retell-webhook] received event:', body?.event, '| call_id:', body?.call?.call_id);

  // Only process call_ended events
  if (body?.event && body.event !== 'call_ended') {
    return Response.json({ ok: true, skipped: true });
  }

  const { name, phone, email, summary, transcript, callType } = extractCallData(body);

  console.log('[retell-webhook] extracted — name:', name, '| phone:', phone, '| email:', email, '| call_type:', callType);

  if (callType === 'personal') {
    // Email admin, don't log to phone_leads
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM,
          to: [ADMIN_EMAIL],
          subject: 'Personal call received — One Love',
          text: [
            'A personal call came in through the service line.',
            '',
            name ? 'Caller: ' + name : '',
            phone ? 'Phone: ' + phone : '',
            summary ? 'Summary: ' + summary : '',
            transcript ? '\nTranscript:\n' + transcript : '',
          ].filter(Boolean).join('\n'),
        });
        console.log('[retell-webhook] personal call — admin email sent');
      } catch (err) {
        console.error('[retell-webhook] failed to send personal call email:', err?.message || err);
      }
    }
    return Response.json({ ok: true, action: 'emailed_admin' });
  }

  // service or junk (or unknown) — insert into phone_leads
  if (!supabaseAdmin) {
    console.error('[retell-webhook] supabaseAdmin unavailable');
    return Response.json({ error: 'DB unavailable' }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('phone_leads').insert({
    name,
    phone,
    email,
    summary,
    transcript,
    call_type: callType === 'junk' ? 'junk' : 'service',
    status: 'new',
  });

  if (error) {
    console.error('[retell-webhook] DB insert failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log('[retell-webhook] lead saved — type:', callType || 'service');
  pushToAdmin({ title: 'New phone lead — ' + (name || 'Unknown'), body: phone || '', url: '/admin/service', tag: 'olo-admin-lead' }).catch(() => {});

  // If we captured an email, send them a link to book
  if (email && resend) {
    const firstName = name ? name.split(' ')[0] : null;
    try {
      await resend.emails.send({
        from: FROM,
        to: [email],
        subject: 'Book your bicycle service — One Love Outdoors',
        text: [
          'Hi' + (firstName ? ' ' + firstName : '') + ',',
          '',
          'Thanks for calling One Love Outdoors. Book your bicycle service here and we\'ll get you on the schedule:',
          '',
          SCHEDULE_URL,
          '',
          'Questions? Call or text us anytime.',
          '',
          '— One Love Outdoors',
        ].join('\n'),
      });
      console.log('[retell-webhook] booking link email sent to caller:', email);
    } catch (err) {
      console.error('[retell-webhook] failed to send booking link email:', err?.message || err);
    }
  }

  return Response.json({ ok: true, action: 'saved' });
}
