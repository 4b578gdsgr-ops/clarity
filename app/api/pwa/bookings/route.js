import { supabaseAdmin } from '../../../../lib/supabase';

function normalizePhone(p) {
  return (p || '').replace(/\D/g, '');
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  if (!phone) return Response.json({ error: 'phone required' }, { status: 400 });

  const digits = normalizePhone(phone);
  if (digits.length < 7) return Response.json({ error: 'invalid phone' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .select('id, name, phone, status, created_at, confirmed_date, return_date, bikes, bike_brand, issues, address')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const bookings = (data || []).filter(b => normalizePhone(b.phone) === digits);
  return Response.json({ bookings });
}
