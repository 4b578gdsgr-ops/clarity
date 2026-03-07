import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';

function adminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured — check SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

export async function PATCH(request, { params }) {
  try {
    const db = adminClient();
    const body = await request.json();

    // Build update payload — only include keys that were sent
    const update = {};
    const allowed = ['name', 'address', 'city', 'state', 'zip', 'lat', 'lng', 'phone',
      'website', 'email', 'brands_carried', 'services', 'shop_type', 'active', 'verified'];

    for (const key of allowed) {
      if (key in body) {
        if (key === 'brands_carried') {
          update[key] = parseBrands(body[key]);
        } else if (key === 'state') {
          update[key] = body[key]?.toUpperCase() || null;
        } else {
          update[key] = body[key];
        }
      }
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from('shops')
      .update(update)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ shop: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = adminClient();
    const { error } = await db.from('shops').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseBrands(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}
