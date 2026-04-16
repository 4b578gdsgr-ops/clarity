import { supabaseAdmin } from '../../../lib/supabase';

// GET /api/phone-leads
export async function GET() {
  if (!supabaseAdmin) return Response.json({ error: 'Admin unavailable' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('phone_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ leads: data || [] });
}

// PATCH /api/phone-leads/[id] is handled separately, but for simplicity:
// PATCH /api/phone-leads with { id, status }
export async function PATCH(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin unavailable' }, { status: 500 });

  const { id, status } = await request.json();
  if (!id || !status) return Response.json({ error: 'id and status required' }, { status: 400 });

  const VALID = ['new', 'dismissed', 'junk', 'converted'];
  if (!VALID.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('phone_leads')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ lead: data });
}
