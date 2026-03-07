import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, tier, bikes_owned } = body;

    if (!name || !email || !tier) {
      return NextResponse.json({ error: 'Name, email, and tier are required' }, { status: 400 });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('membership_signups').insert({
        name, email, tier, bikes_owned, status: 'interested',
      });
      if (error) throw error;
    } catch (dbErr) {
      console.log('Membership signup (no DB):', { name, email, tier });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
