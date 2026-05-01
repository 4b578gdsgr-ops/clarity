import { supabaseAdmin } from '../../../../lib/supabase';

export async function DELETE(req, { params }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from('group_rides').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
