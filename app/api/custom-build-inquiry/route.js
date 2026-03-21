import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, budget_range, riding_style, dream_bike_description, bike_types } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('custom_build_inquiries').insert({
        name, email, phone, budget_range, riding_style, dream_bike_description,
        bike_types: bike_types || [],
        status: 'new',
      });
      if (error) throw error;
    } catch (dbErr) {
      console.log('[custom-build] DB insert failed:', dbErr?.message);
    }

    if (resend) {
      // Admin notification
      try {
        const adminResult = await resend.emails.send({
          from: 'One Love Outdoors <service@oneloveoutdoors.org>',
          to: ['service@oneloveoutdoors.org'],
          subject: `New custom build inquiry — ${name}`,
          text: [
            `${name} is interested in a custom build.`,
            '',
            `Email: ${email || 'not provided'}`,
            `Phone: ${phone || 'not provided'}`,
            `Budget: ${budget_range || 'not provided'}`,
            `Riding style: ${riding_style || 'not provided'}`,
            `Dream bike: ${dream_bike_description || 'not provided'}`,
            '',
            'View in admin: https://clarity-pi-ten.vercel.app/admin/service',
          ].join('\n'),
        });
        console.log('[custom-build] admin email result:', JSON.stringify(adminResult));
      } catch (err) {
        console.error('[custom-build] admin email failed:', err?.message);
      }

      // Customer confirmation
      try {
        const customerResult = await resend.emails.send({
          from: 'One Love Outdoors <service@oneloveoutdoors.org>',
          to: [email],
          subject: 'Thanks for reaching out about a custom build',
          text: [
            `Hi ${name},`,
            '',
            `Thanks for reaching out about a custom build. We'll be in touch within a couple days to talk through the details.`,
            '',
            '— One Love Outdoors',
          ].join('\n'),
        });
        console.log('[custom-build] customer email result:', JSON.stringify(customerResult));
      } catch (err) {
        console.error('[custom-build] customer email failed:', err?.message);
      }
    } else {
      console.error('[custom-build] RESEND_API_KEY not set — skipping emails');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[custom-build] route error:', err?.message);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
