import { supabaseAdmin } from '../../../lib/supabase';
import { getZoneForZip } from '../../../lib/serviceZones';

// GET /api/bookings?date=YYYY-MM-DD&status=booked
export async function GET(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const date   = searchParams.get('date');
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('service_bookings')
    .select('*')
    .order('pickup_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (date)   query = query.eq('pickup_date', date);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ bookings: data });
}

// POST /api/bookings
export async function POST(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const body = await request.json();
  const { name, address, city, state, zip, phone, email,
          bike_brand, bike_model, issues, notes,
          pickup_date, time_slot, is_member } = body;

  if (!name || !address || !zip || !pickup_date || !time_slot) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Geocode address for map pin
  let lat = null, lng = null;
  try {
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ' ' + city + ' ' + (state || 'CT'))}&format=json&countrycodes=us&limit=1`,
      { headers: { 'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)' } }
    );
    const geoData = await geo.json();
    if (geoData[0]) { lat = parseFloat(geoData[0].lat); lng = parseFloat(geoData[0].lon); }
  } catch { /* proceed without coords */ }

  const zone = getZoneForZip(zip);

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .insert([{
      name, address, city, state: state || 'CT', zip,
      lat, lng, phone, email,
      bike_brand, bike_model,
      issues: Array.isArray(issues) ? issues : [],
      notes, zone, pickup_date, time_slot,
      is_member: !!is_member,
      status: 'booked',
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Fire-and-forget webhook notification (connect to email later)
  const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
  if (webhookUrl && data) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_booking',
        booking_id: data.id,
        name: data.name,
        pickup_date: data.pickup_date,
        time_slot: data.time_slot,
        address: [data.address, data.city, data.state, data.zip].filter(Boolean).join(', '),
        bike: [data.bike_brand, data.bike_model].filter(Boolean).join(' ') || 'not specified',
        issues: data.issues || [],
        is_member: data.is_member,
        zone: data.zone,
        phone: data.phone,
        notes: data.notes,
      }),
    }).catch(() => {}); // non-blocking
  }

  return Response.json({ booking: data }, { status: 201 });
}
