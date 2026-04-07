import { supabaseAdmin } from '../../../../lib/supabase';

// GET /api/inspections/[bookingId]
export async function GET(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { bookingId } = params;
  const { data, error } = await supabaseAdmin
    .from('inspection_reports')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ report: data || null });
}

// PUT /api/inspections/[bookingId]
export async function PUT(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { bookingId } = params;
  const body = await request.json();
  const { items, notes } = body;

  if (!Array.isArray(items)) {
    return Response.json({ error: 'items must be an array' }, { status: 400 });
  }

  // Upsert: delete existing then insert, so we always have one report per booking
  await supabaseAdmin
    .from('inspection_reports')
    .delete()
    .eq('booking_id', bookingId);

  const { data, error } = await supabaseAdmin
    .from('inspection_reports')
    .insert([{ booking_id: bookingId, items, notes: notes || null }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ report: data });
}
