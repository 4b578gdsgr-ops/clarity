import { supabaseAdmin } from '../../../lib/supabase';

function normalizePhone(p) {
  return (p || '').replace(/\D/g, '');
}

// Strips admin-only fields — returns only customer-safe data
function sanitize(b) {
  return {
    id: b.id,
    status: b.status,
    created_at: b.created_at,
    updated_at: b.updated_at || b.created_at,
    confirmed_date: b.confirmed_date || null,
    return_date: b.return_date || null,
    bike_brand: b.bike_brand || null,
    issues: b.issues || [],
    address: b.address || null,
    bikes: (b.bikes || []).map(({ brand, type, issues }) => ({ brand, type, issues })),
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '';
  const idsParam = searchParams.get('ids') || '';

  const digits = normalizePhone(phone);
  const ids = idsParam ? idsParam.split(',').filter(id => id.trim().length > 30) : [];

  if (!digits && !ids.length) {
    return Response.json({ bookings: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .select('id, status, created_at, updated_at, confirmed_date, return_date, bike_brand, issues, bikes, address, phone')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const seen = new Set();
  const results = [];

  for (const b of data || []) {
    if (seen.has(b.id)) continue;
    const phoneMatch = digits && normalizePhone(b.phone) === digits;
    const idMatch = ids.includes(b.id);
    if (phoneMatch || idMatch) {
      seen.add(b.id);
      results.push(sanitize(b));
    }
  }

  return Response.json({ bookings: results });
}
