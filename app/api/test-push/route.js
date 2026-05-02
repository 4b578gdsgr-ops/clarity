import { supabaseAdmin } from '../../../lib/supabase';
import { pushToBooking } from '../../../lib/push';

// GET /api/test-push?bookingId=XXX
// Manually fires a test push to all subscriptions for a booking.
// Only reachable from admin — use to verify the whole pipeline.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  if (!bookingId) return Response.json({ error: 'bookingId query param required' }, { status: 400 });

  const { data: subs, error: subErr } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, created_at')
    .eq('booking_id', bookingId);

  if (subErr) return Response.json({ error: subErr.message }, { status: 500 });

  const result = {
    bookingId,
    subscriptionsFound: subs?.length || 0,
    subscriptions: (subs || []).map(s => ({
      id: s.id,
      endpoint: s.endpoint.slice(0, 80) + '...',
      created_at: s.created_at,
    })),
  };

  if (!subs || subs.length === 0) {
    return Response.json({ ...result, sent: false, reason: 'No subscriptions for this booking' });
  }

  await pushToBooking(bookingId, {
    title: 'Test notification',
    body: 'Push notifications are working.',
    url: '/service/' + bookingId,
    tag: 'olo-test',
  });

  return Response.json({ ...result, sent: true });
}
