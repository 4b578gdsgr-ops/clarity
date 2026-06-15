import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
console.log('[email] module loaded — resend initialized:', !!resend, '| RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

const FROM = 'One Love Outdoors <service@oneloveoutdoors.org>';
const ADMIN_EMAIL = 'service@oneloveoutdoors.org';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';

function trackingLink(id) {
  return BASE_URL + '/embed/service/' + id;
}

/**
 * Send "we got your request" email to a new customer.
 * Only call this when contact_preference === 'email'.
 */
export async function sendNewBookingEmail(booking) {
  console.log('[email] sendNewBookingEmail — to:', booking?.email || '(no email)', '| resend ready:', !!resend);
  if (!resend) { console.error('[email] RESEND_API_KEY missing — skipping new booking email'); return; }
  if (!booking.email) { console.warn('[email] booking has no email — skipping new booking email'); return; }

  const name = booking.name || 'there';
  const link = trackingLink(booking.id);

  try {
    await resend.emails.send({
      from: FROM,
      to: [booking.email],
      subject: 'We got your bicycle service request',
      text: [
        `Hi ${name},`,
        '',
        "Thanks for booking with One Love. We'll be in touch to confirm a pickup time.",
        '',
        `Track your service here: ${link}`,
        '',
        '— One Love Outdoors',
      ].join('\n'),
    });
    console.log('[email] New booking email sent to', booking.email);
  } catch (err) {
    console.error('[email] Failed to send new booking email to', booking.email, ':', err?.message || err);
  }
}

/**
 * Send a message from admin to customer.
 * Only call this when contact_preference === 'email'.
 */
export async function sendMessageEmail(booking, messageText) {
  console.log('[email] sendMessageEmail — to:', booking?.email || '(no email)', '| resend ready:', !!resend);
  if (!resend) { console.error('[email] RESEND_API_KEY missing — skipping customer message email'); return; }
  if (!booking.email) { console.warn('[email] booking has no email — skipping customer message email'); return; }

  const name = booking.name || 'there';
  const link = trackingLink(booking.id);

  try {
    await resend.emails.send({
      from: FROM,
      to: [booking.email],
      subject: 'New message from One Love Outdoors',
      text: [
        `Hi ${name},`,
        '',
        messageText,
        '',
        `Reply here: ${link}`,
        '',
        '— One Love Outdoors',
      ].join('\n'),
    });
    console.log('[email] Message email sent to', booking.email);
  } catch (err) {
    console.error('[email] Failed to send message email to', booking.email, ':', err?.message || err);
  }
}

/**
 * Notify admin of a new booking.
 * No inner try/catch — errors propagate so they're visible in logs.
 */
export async function sendNewBookingAdminEmail(booking) {
  console.log('[email] sendNewBookingAdminEmail — resend ready:', !!resend, '| booking id:', booking?.id);
  if (!resend) {
    throw new Error('[email] RESEND_API_KEY missing — cannot send admin notification');
  }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [ADMIN_EMAIL],
    subject: `New booking — ${booking.name || 'Unknown'} (${booking.bike_brand || 'No brand'})`,
    text: [
      'New bicycle service:',
      '',
      `Name: ${booking.name}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email || 'None'}`,
      `Address: ${booking.address || 'None'}`,
      booking.bikes?.length > 0
        ? booking.bikes.map((b, i) => `Bike ${i + 1}: ${b.brand || '?'} — ${(b.issues || []).join(', ')}`).join('\n')
        : `Bike: ${booking.bike_brand || 'Not specified'}\nIssues: ${(booking.issues || []).join(', ')}`,
      `Preferred: ${booking.preferred_day || ''} ${booking.preferred_time || ''}`.trim() || 'None',
      `Contact via: ${booking.contact_preference || 'Not set'}`,
      `Notes: ${booking.notes || 'None'}`,
      '',
      `View in admin: ${BASE_URL}/admin/service`,
    ].join('\n'),
  });
  if (error) {
    throw new Error('[email] Resend API error: ' + (error?.message || JSON.stringify(error)));
  }
  console.log('[email] Admin new booking email sent — resend id:', data?.id);
  return data;
}

/**
 * Notify admin that a customer sent a message.
 */
export async function sendAdminMessageNotification(booking, messageText) {
  console.log('[email] sendAdminMessageNotification — resend ready:', !!resend, '| booking name:', booking?.name);
  if (!resend) { console.error('[email] RESEND_API_KEY missing — skipping admin notification'); return; }

  const name = booking.name || 'Customer';
  const bike = booking.bike_brand || '';
  const issues = Array.isArray(booking.issues) && booking.issues.length > 0
    ? booking.issues.join(', ')
    : '';
  const bookingLine = [bike, issues].filter(Boolean).join(' — ');

  try {
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: 'New message from ' + name,
      text: [
        messageText,
        '',
        bookingLine ? 'Booking: ' + bookingLine : '',
        'Reply: ' + BASE_URL + '/admin/service',
      ].filter(Boolean).join('\n'),
    });
  } catch (err) {
    console.error('[email] Failed to send admin message notification:', err?.message || err);
  }
}

/**
 * Notify admin that a customer cancelled.
 */
export async function sendCancellationNotification(booking) {
  console.log('[email] sendCancellationNotification — resend ready:', !!resend, '| booking id:', booking?.id);
  if (!resend) { console.error('[email] RESEND_API_KEY missing — skipping cancellation notification'); return; }

  const name = booking.name || 'Unknown';
  const bike = booking.bike_brand || (booking.bikes?.[0]?.brand) || 'No brand';

  try {
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `Booking cancelled — ${name}`,
      text: [
        `${name} cancelled their booking.`,
        '',
        `Bike: ${bike}`,
        booking.phone ? `Phone: ${booking.phone}` : '',
        booking.confirmed_date ? `Was scheduled: ${booking.confirmed_date}` : '',
        '',
        `View in admin: ${BASE_URL}/admin/service`,
      ].filter(Boolean).join('\n'),
    });
    console.log('[email] Cancellation notification sent for booking', booking.id);
  } catch (err) {
    console.error('[email] Failed to send cancellation notification:', err?.message || err);
  }
}

/**
 * Notify admin that a customer confirmed their pickup.
 */
export async function sendPickupConfirmedAdminEmail(booking) {
  console.log('[email] sendPickupConfirmedAdminEmail — resend ready:', !!resend, '| booking id:', booking?.id);
  if (!resend) { console.error('[email] RESEND_API_KEY missing — skipping pickup confirmed admin email'); return; }

  const name = booking.name || 'Customer';

  try {
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `Pickup confirmed — ${name}`,
      text: [
        `Pickup confirmed by ${name}.`,
        '',
        booking.phone ? `Phone: ${booking.phone}` : '',
        booking.confirmed_date ? `Scheduled: ${booking.confirmed_date}` : '',
        '',
        `View in admin: ${BASE_URL}/admin/service`,
      ].filter(Boolean).join('\n'),
    });
  } catch (err) {
    console.error('[email] Failed to send pickup confirmed admin email:', err?.message || err);
  }
}

/**
 * Notify admin that a customer confirmed delivery details.
 */
export async function sendDeliveryConfirmedAdminEmail(booking) {
  console.log('[email] sendDeliveryConfirmedAdminEmail — resend ready:', !!resend, '| booking id:', booking?.id);
  if (!resend) { console.error('[email] RESEND_API_KEY missing — skipping delivery confirmed admin email'); return; }

  const name = booking.name || 'Customer';

  try {
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `Delivery confirmed — ${name}`,
      text: [
        `Delivery confirmed by ${name}.`,
        '',
        booking.delivery_address ? `Address: ${booking.delivery_address}` : '',
        booking.delivery_preferred_day ? `Day: ${booking.delivery_preferred_day}` : '',
        booking.delivery_preferred_time ? `Time: ${booking.delivery_preferred_time}` : '',
        '',
        `View in admin: ${BASE_URL}/admin/service`,
      ].filter(Boolean).join('\n'),
    });
  } catch (err) {
    console.error('[email] Failed to send delivery confirmed admin email:', err?.message || err);
  }
}
