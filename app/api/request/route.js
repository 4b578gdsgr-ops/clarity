import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

// Create admin client at request-time so it always picks up the current env var.
// Service role key bypasses RLS — never expose it to the client.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('[request] admin client check — url:', !!url, 'serviceKey:', !!key);
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ count: 0, top: [] });
  }
  try {
    const { count } = await supabase
      .from('company_requests')
      .select('*', { count: 'exact', head: true });

    const { data: top } = await supabase
      .from('company_requests')
      .select('company, votes')
      .order('votes', { ascending: false })
      .limit(10);

    return NextResponse.json({ count: count ?? 0, top: top ?? [] });
  } catch {
    return NextResponse.json({ count: 0, top: [] });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const company = body?.company?.trim();
  if (!company) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 });
  }

  const admin = getAdminClient();
  const db = admin ?? supabase;

  console.log('[request] POST company:', company, '| using admin:', !!admin, '| db:', !!db);

  if (!db) {
    console.log('[request] no db client — returning fallback success');
    return NextResponse.json({ success: true, count: 1 });
  }

  try {
    const { data: existing, error: selectError } = await db
      .from('company_requests')
      .select('id, votes')
      .ilike('company', company)
      .limit(1)
      .maybeSingle();

    console.log('[request] select result — existing:', existing, 'error:', selectError);

    if (selectError) {
      console.error('[request] select error:', selectError);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (existing) {
      const { error: updateError } = await db
        .from('company_requests')
        .update({ votes: existing.votes + 1 })
        .eq('id', existing.id);

      console.log('[request] update error:', updateError);
      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
    } else {
      const { data: inserted, error: insertError } = await db
        .from('company_requests')
        .insert({ company, votes: 1 })
        .select();

      console.log('[request] insert result — data:', inserted, 'error:', insertError);
      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
    }

    const { count } = await db
      .from('company_requests')
      .select('*', { count: 'exact', head: true });

    console.log('[request] final count:', count);
    return NextResponse.json({ success: true, count: count ?? 1 });
  } catch (err) {
    console.error('[request] unexpected error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
