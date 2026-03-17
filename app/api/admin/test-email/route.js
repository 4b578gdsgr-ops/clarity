import { sendServiceEmail } from '../../../../lib/email';

// GET /api/admin/test-email?to=you@example.com
// Fires a test 'new' booking email so you can verify Resend is working end-to-end.
// Protected by a simple secret param — don't ship this without the check.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to');
  const secret = searchParams.get('secret');

  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!to) {
    return Response.json({ error: 'Pass ?to=email&secret=ADMIN_SECRET' }, { status: 400 });
  }

  const fakeBooking = {
    id: 'test-000',
    name: 'Test Rider',
    email: to,
    bike_brand: 'Trek',
    confirmed_date: null,
    confirmed_time: null,
    return_date: null,
    invoice_amount: null,
    payment_link: null,
  };

  console.log('[test-email] Firing test email to', to);
  await sendServiceEmail('new', fakeBooking);
  console.log('[test-email] Done');

  return Response.json({
    ok: true,
    resend_key_present: !!process.env.RESEND_API_KEY,
    sent_to: to,
  });
}
