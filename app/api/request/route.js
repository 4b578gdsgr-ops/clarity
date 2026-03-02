import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

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

  if (!supabase) {
    return NextResponse.json({ success: true, count: 1 });
  }

  try {
    const { data: existing } = await supabase
      .from('company_requests')
      .select('id, votes')
      .ilike('company', company)
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('company_requests')
        .update({ votes: existing.votes + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('company_requests')
        .insert({ company, votes: 1 });
    }

    const { count } = await supabase
      .from('company_requests')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ success: true, count: count ?? 1 });
  } catch {
    return NextResponse.json({ success: true, count: 1 });
  }
}
