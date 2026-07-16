import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';
import { pushToAdmin } from '../../../lib/push';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = 'service@oneloveoutdoors.org';
const FROM = 'One Love Outdoors <service@oneloveoutdoors.org>';
const SCHEDULE_URL = 'https://oneloveoutdoors.org/schedule-service-app';

function extractCallDuration(call) {
  if (typeof call?.duration_ms === 'number') return Math.round(call.duration_ms / 1000);
  if (typeof call?.start_timestamp === 'number' && typeof call?.end_timestamp === 'number') {
    return Math.round((call.end_timestamp - call.start_timestamp) / 1000);
  }
  return null;
}

function extractCallData(body) {
  const call = body?.call || body;
  const analysis = call?.call_analysis || {};
  // Retell puts structured extraction in custom_analysis_data
  const custom = analysis?.custom_analysis_data || call?.retell_llm_dynamic_variables || {};

  const name        = custom?.caller_name     || custom?.name          || null;
  const phone       = custom?.caller_phone    || custom?.phone         || call?.from_number || null;
  const email       = custom?.caller_email    || custom?.email         || null;
  const address     = custom?.caller_address  || custom?.address       || null;
  const bikeIssue   = custom?.bike_issue      || null;
  const preferredDay= custom?.preferred_day   || null;
  const summary     = custom?.call_summary    || analysis?.call_summary || null;
  const transcript  = call?.transcript        || null;
  const callType    = custom?.call_type       || custom?.type          || null;
  const durationSeconds = extractCallDuration(call);

  return { name, phone, email, address, bikeIssue, preferredDay, summary, transcript, callType, durationSeconds };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[retell-webhook] event:', body?.event, '| call_id:', body?.call?.call_id);

  if (body?.event && body.event !== 'call_ended') {
    return Response.json({ ok: true, skipped: true });
  }

  const { name, phone, email, address, bikeIssue, preferredDay, summary, transcript, callType, durationSeconds } = extractCallData(body);

  console.log('[retell-webhook] extracted — name:', name, '| phone:', phone, '| call_type:', callType, '| bike_issue:', bikeIssue, '| preferred_day:', preferredDay, '| duration_s:', durationSeconds);

  // Personal call — email admin only, no lead record
  if (callType === 'personal') {
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM,
          to: [ADMIN_EMAIL],
          subject: 'Personal call — One Love',
          text: [
            'Personal call received on the service line.',
            '',
            name    ? 'Caller: '  + name    : '',
            phone   ? 'Phone: '   + phone   : '',
            summary ? 'Summary: ' + summary : '',
            transcript ? '\nTranscript:\n' + transcript : '',
          ].filter(Boolean).join('\n'),
        });
        console.log('[retell-webhook] personal call — admin email sent');
      } catch (err) {
        console.error('[retell-webhook] personal call email failed:', err?.message || err);
      }
    }
    return Response.json({ ok: true, action: 'emailed_admin' });
  }

  // Junk — log silently, no notification
  if (callType === 'junk') {
    console.log('[retell-webhook] junk call — discarding');
    return Response.json({ ok: true, action: 'discarded' });
  }

  // Only create a lead for genuine service calls with real signal — anything
  // thinner than that (misdials, hangups, robocalls) is discarded silently.
  const signalCount = [name, phone, bikeIssue].filter(Boolean).length;
  if (callType !== 'service' || signalCount < 2) {
    console.log('[retell-webhook] insufficient signal for a lead — discarding (call_type:', callType, ', signals:', signalCount + '/3)');
    return Response.json({ ok: true, action: 'discarded' });
  }

  if (!supabaseAdmin) {
    console.error('[retell-webhook] supabaseAdmin unavailable');
    return Response.json({ error: 'DB unavailable' }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('phone_leads').insert({
    name,
    phone,
    email,
    address,
    bike_issue: bikeIssue,
    preferred_day: preferredDay,
    summary,
    transcript,
    call_type: 'service',
    status: 'new',
    call_duration_seconds: durationSeconds,
  });

  if (error) {
    console.error('[retell-webhook] DB insert failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log('[retell-webhook] service lead saved');
  pushToAdmin({ title: 'New phone lead — ' + (name || 'Unknown'), body: [phone, bikeIssue].filter(Boolean).join(' · '), url: '/admin/service', tag: 'olo-admin-lead' }).catch(() => {});

  // If email captured, send booking link
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
      console.log('[retell-webhook] booking link email sent to:', email);
    } catch (err) {
      console.error('[retell-webhook] booking link email failed:', err?.message || err);
    }
  }

  return Response.json({ ok: true, action: 'saved' });
}
