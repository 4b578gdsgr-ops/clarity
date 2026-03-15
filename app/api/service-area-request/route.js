import { supabaseAdmin } from '../../../lib/supabase';

// POST /api/service-area-request  { zip }
export async function POST(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { zip } = await request.json();
  const clean = zip?.trim().slice(0, 5);
  if (!clean || clean.length !== 5 || !/^\d{5}$/.test(clean)) {
    return Response.json({ error: 'Invalid ZIP' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('service_area_requests')
    .insert([{ zip: clean }]);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true }, { status: 201 });
}

// GET /api/service-area-request — admin: ZIP demand counts
export async function GET() {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('service_area_requests')
    .select('zip')
    .order('zip');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Group by ZIP and count
  const counts = {};
  for (const row of data) {
    counts[row.zip] = (counts[row.zip] || 0) + 1;
  }
  const sorted = Object.entries(counts)
    .map(([zip, count]) => ({ zip, count }))
    .sort((a, b) => b.count - a.count);

  return Response.json({ requests: sorted });
}
