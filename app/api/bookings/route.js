import { supabaseAdmin } from '../../../lib/supabase';

// GET /api/bookings?status=new
export async function GET(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('service_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ bookings: data });
}

// POST /api/bookings
export async function POST(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const body = await request.json();
  const { name, phone, email, lat, lng, address,
          bike_brand, issues, notes,
          preferred_day, time_slot } = body;

  if (!name || !phone) {
    return Response.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .insert([{
      name,
      phone,
      email: email || null,
      lat: lat || null,
      lng: lng || null,
      address: address || null,
      bike_brand: bike_brand || null,
      issues: Array.isArray(issues) ? issues : [],
      notes: notes || null,
      preferred_day: preferred_day || null,
      time_slot: time_slot || null,
      status: 'new',
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Fire-and-forget webhook
  const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
  if (webhookUrl && data) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_booking',
        booking_id: data.id,
        name: data.name,
        phone: data.phone,
        bike: data.bike_brand || 'not specified',
        issues: data.issues || [],
        preferred_day: data.preferred_day,
        time_slot: data.time_slot,
        address: data.address,
        notes: data.notes,
      }),
    }).catch(() => {});
  }

  return Response.json({ booking: data }, { status: 201 });
}
