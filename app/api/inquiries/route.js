import { supabaseAdmin } from '../../../lib/supabase';
import { sendNewInquiryAdminEmail } from '../../../lib/email';

// GET /api/inquiries
export async function GET() {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('service_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ inquiries: data || [] });
}

// DELETE /api/inquiries with { id } — used by admin "Dismiss"
export async function DELETE(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('service_inquiries')
    .delete()
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

// POST /api/inquiries
export async function POST(request) {
  if (!supabaseAdmin) {
    console.error('[inquiries] supabaseAdmin not initialized — check SUPABASE_SERVICE_ROLE_KEY');
    return Response.json({ error: 'Admin client unavailable' }, { status: 500 });
  }

  const body = await request.json();
  const name = (body?.name || '').trim();
  const phone = (body?.phone || '').trim();
  const message = (body?.message || '').trim();

  if (!name || !phone || !message) {
    return Response.json({ error: 'Name, phone, and message are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_inquiries')
    .insert([{ name, phone, message }])
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
