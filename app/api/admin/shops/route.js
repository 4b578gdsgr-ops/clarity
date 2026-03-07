import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

function adminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured — check SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

export async function GET() {
  try {
    const db = adminClient();
    const { data, error } = await db
      .from('shops')
      .select('*')
      .order('city', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ shops: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = adminClient();
    const body = await request.json();

    const { data, error } = await db
      .from('shops')
      .insert(normalizeShop(body))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ shop: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function normalizeShop(body) {
  return {
    name: body.name?.trim(),
    address: body.address?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim()?.toUpperCase() || null,
    zip: body.zip?.trim() || null,
    lat: body.lat ? parseFloat(body.lat) : null,
    lng: body.lng ? parseFloat(body.lng) : null,
    phone: body.phone?.trim() || null,
    website: body.website?.trim() || null,
    email: body.email?.trim() || null,
    brands_carried: parseBrands(body.brands_carried),
    services: Array.isArray(body.services) ? body.services : [],
    shop_type: body.shop_type || 'indie',
    active: body.active !== false,
    verified: body.verified || false,
  };
}

function parseBrands(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}
