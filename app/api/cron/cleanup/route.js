import { runCleanup } from '../../../../lib/cleanupBookings';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cleaned = await runCleanup();
    console.log('[cron/cleanup] cleaned', cleaned, 'bookings');
    return Response.json({ cleaned });
  } catch (err) {
    console.error('[cron/cleanup] error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
