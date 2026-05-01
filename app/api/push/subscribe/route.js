import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(req) {
  if (!supabaseAdmin) return Response.json({ error: 'Unavailable' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { booking_id, subscription } = body;
  if (!booking_id || !subscription?.endpoint || !subscription?.keys) {
    return Response.json({ error: 'booking_id and subscription required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      { booking_id, endpoint: subscription.endpoint, keys: subscription.keys },
      { onConflict: 'booking_id,endpoint' },
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
