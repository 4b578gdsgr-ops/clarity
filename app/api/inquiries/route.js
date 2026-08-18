import { supabaseAdmin } from '../../../lib/supabase';
import { sendNewInquiryAdminEmail } from '../../../lib/email';

// POST /api/inquiries
export async function POST(request) {
  if (!supabaseAdmin) {
    console.error('[inquiries] supabaseAdmin not initialized — check SUPABASE_SERVICE_ROLE_KEY');
    return Response.json({ error: 'Admin client unavailable' }, { status: 500 });
  }

  const body = await request.json();
  const message = (body?.message || '').trim();

  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_inquiries')
    .insert([{ message }])
    .select()
    .single();

  if (error) {
    console.error('[inquiries] insert error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  try {
    await sendNewInquiryAdminEmail(data);
  } catch (err) {
    console.error('[inquiries] admin email failed:', err?.message || err);
  }

  return Response.json({ inquiry: data }, { status: 201 });
}
