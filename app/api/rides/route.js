import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === '1';
  const today = new Date().toISOString().split('T')[0];
  let query = supabaseAdmin
    .from('group_rides')
    .select('*')
    .order('date', { ascending: true });
  if (!all) query = query.gte('date', today).limit(1);
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(all ? { rides: data || [] } : { ride: data?.[0] || null });
}

export async function POST(req) {
  const { title, date, time, location, description } = await req.json();
  const { data, error } = await supabaseAdmin
    .from('group_rides')
    .insert({ title, date, time, location, description })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ride: data });
}
