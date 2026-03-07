import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { shop_name, address, city, state, zip, submitted_by_email } = body;

    if (!shop_name) {
      return NextResponse.json({ error: 'Shop name required' }, { status: 400 });
    }

    // Try Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('shop_submissions').insert({
        shop_name,
        address,
        city,
        state,
        zip,
        submitted_by_email,
      });
      if (error) throw error;
    } catch {
      // Log to console if Supabase not configured
      console.log('Shop submission (no DB):', { shop_name, city, state, zip });
    }

    return NextResponse.json({ success: true, message: 'Thanks! We\'ll review and add your shop.' });
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
