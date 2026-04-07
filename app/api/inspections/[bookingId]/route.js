import { supabaseAdmin } from '../../../../lib/supabase';

// GET /api/inspections/[bookingId] — returns all bike reports for a booking
export async function GET(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { bookingId } = params;
  const { data, error } = await supabaseAdmin
    .from('inspection_reports')
    .select('*')
    .eq('booking_id', bookingId)
    .order('bike_index');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ reports: data || [] });
}

// PUT /api/inspections/[bookingId] — upserts one bike's report
export async function PUT(request, { params }) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { bookingId } = params;
  const body = await request.json();
  const { bike_index = 0, items, notes } = body;

  if (!Array.isArray(items)) {
    return Response.json({ error: 'items must be an array' }, { status: 400 });
  }

  // Upsert: delete existing for this bike then insert
  await supabaseAdmin
    .from('inspection_reports')
    .delete()
    .eq('booking_id', bookingId)
    .eq('bike_index', bike_index);

  const { data, error } = await supabaseAdmin
    .from('inspection_reports')
    .insert([{ booking_id: bookingId, bike_index, items, notes: notes || null }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ report: data });
}
