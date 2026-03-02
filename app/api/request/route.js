import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

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

  // Use admin client for writes so RLS doesn't block server-side inserts.
  // Fall back gracefully if service role key isn't configured.
  const db = supabaseAdmin ?? supabase;
  if (!db) {
    return NextResponse.json({ success: true, count: 1 });
  }

  try {
    // Check if this company has already been requested (case-insensitive)
    const { data: existing, error: selectError } = await db
      .from('company_requests')
      .select('id, votes')
      .ilike('company', company)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error('company_requests select error:', selectError.message);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (existing) {
      const { error: updateError } = await db
        .from('company_requests')
        .update({ votes: existing.votes + 1 })
        .eq('id', existing.id);

      if (updateError) {
        console.error('company_requests update error:', updateError.message);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await db
        .from('company_requests')
        .insert({ company, votes: 1 });

      if (insertError) {
        console.error('company_requests insert error:', insertError.message);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
    }

    const { count } = await db
      .from('company_requests')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ success: true, count: count ?? 1 });
  } catch (err) {
    console.error('company_requests unexpected error:', err);
    return NextResponse.json({ success: true, count: 1 });
  }
}
