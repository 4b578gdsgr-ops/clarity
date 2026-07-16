// force deploy
import { supabaseAdmin } from '../../../../lib/supabase';
import { extractLeadFromTranscript } from '../../../../lib/leadExtraction';

// Force-rebuild marker: previous deploy of this route didn't go live on Vercel.

// POST /api/phone-leads/auto-review
// Backfills leads whose transcript never got name/phone/bike_issue filled in
// (Retell's own extraction came back empty) by running the transcript
// through Claude. Junk -> marked junk. Real service call -> lead fields
// filled in. Neither -> dismissed. Only active (non-dismissed/junk/converted)
// leads are considered.
export async function POST() {
  if (!supabaseAdmin) return Response.json({ error: 'Admin unavailable' }, { status: 500 });

  const { data: leads, error } = await supabaseAdmin
    .from('phone_leads')
    .select('id, name, phone, bike_issue, transcript')
    .not('status', 'in', '(dismissed,junk,converted)')
    .not('transcript', 'is', null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const candidates = (leads || []).filter(l =>
    l.transcript && l.transcript.trim() && (!l.name || !l.phone || !l.bike_issue)
  );

  let updated = 0, junked = 0, dismissed = 0, failed = 0;

  for (const lead of candidates) {
    const extracted = await extractLeadFromTranscript(lead.transcript);
    if (!extracted) { failed++; continue; }

    if (extracted.is_junk) {
      await supabaseAdmin.from('phone_leads').update({ status: 'junk' }).eq('id', lead.id);
      junked++;
    } else if (extracted.is_service_call) {
      await supabaseAdmin.from('phone_leads').update({
        name: extracted.caller_name || lead.name || null,
        phone: extracted.caller_phone || lead.phone || null,
        bike_issue: extracted.bike_issue || lead.bike_issue || null,
        address: extracted.address || null,
      }).eq('id', lead.id);
      updated++;
    } else {
      await supabaseAdmin.from('phone_leads').update({ status: 'dismissed' }).eq('id', lead.id);
      dismissed++;
    }
  }

  return Response.json({ reviewed: candidates.length, updated, junked, dismissed, failed });
}
