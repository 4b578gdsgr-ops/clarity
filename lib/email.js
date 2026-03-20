import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
console.log('[email] module loaded — resend initialized:', !!resend, '| RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

const FROM = 'One Love Outdoors <service@oneloveoutdoors.org>';
const ADMIN_EMAIL = 'service@oneloveoutdoors.org';
const BASE_URL = 'https://clarity-pi-ten.vercel.app';

function trackingLink(id) {
  return BASE_URL + '/embed/service/' + id;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function fmtTime(timeStr) {
  if (!timeStr) return '';
  const [h, min] = timeStr.split(':').map(Number);
  return (h % 12 || 12) + ':' + String(min).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM');
}

/**
 * Send a status email to the customer.
 * trigger: 'new' | 'confirmed' | 'picked_up' | 'done'
 * booking: full booking row from Supabase
 *
 * Silently skips if:
 *  - RESEND_API_KEY is not set
 *  - booking has no email address
 *  - trigger is not a known status
 */
export async function sendServiceEmail(trigger, booking) {
  console.log('[email] sendServiceEmail called — trigger:', trigger, '| booking id:', booking?.id, '| to:', booking?.email || '(no email)', '| resend ready:', !!resend, '| KEY present at call time:', !!process.env.RESEND_API_KEY);
  if (!resend) { console.error('[email] RESEND_API_KEY missing at call time — skipping customer email'); return; }
  if (!booking.email) { console.warn('[email] booking has no email — skipping customer email (this is normal if customer skipped email field)'); return; }

  const name = booking.name || 'there';
  const bike = booking.bike_brand || 'your bike';
  const link = trackingLink(booking.id);

  let subject, text;

  switch (trigger) {
    case 'new':
      subject = 'We got your service request';
      text = [
        `Hi ${name},`,
        '',
        "Thanks for booking with One Love. We'll confirm a pickup time shortly — usually within a day.",
        '',
        `Track your service here: ${link}`,
        '',
        '— One Love Outdoors',
      ].join('\n');
      break;

    case 'confirmed': {
      const date = booking.confirmed_date ? fmtDate(booking.confirmed_date) : 'the scheduled day';
      const time = booking.confirmed_time ? ' around ' + fmtTime(booking.confirmed_time) : '';
      subject = `Pickup confirmed — ${date}`;
      text = [
        `Hi ${name},`,
        '',
        `Your pickup is confirmed for ${date}${time}. We'll reach out when we're on our way.`,
        '',
        `Track your service: ${link}`,
        '',
        '— One Love Outdoors',
      ].join('\n');
      break;
    }

    case 'picked_up': {
      const returnDate = booking.return_date ? fmtDate(booking.return_date) : 'Friday';
      subject = "We've got your bike";
      text = [
        `Hi ${name},`,
        '',
        `Your ${bike} is in the shop. We'll update you when it's ready. Estimated return: ${returnDate}.`,
        '',
        `Track your service: ${link}`,
        '',
        '— One Love Outdoors',
      ].join('\n');
      break;
    }

    case 'done': {
      const returnDate = booking.return_date ? fmtDate(booking.return_date) : 'soon';
      subject = 'Your bike is ready';
      const hasPayment = booking.invoice_amount != null && booking.payment_link;
      if (hasPayment) {
        text = [
          `Hi ${name},`,
          '',
          `Your ${bike} is ready.`,
          '',
          `Total: $${Number(booking.invoice_amount).toFixed(2)}`,
          '',
          `Pay online: ${booking.payment_link}`,
          `Or pay at dropoff — card or cash, your choice.`,
          '',
          `We'll deliver on ${returnDate}.`,
          '',
          '— One Love Outdoors',
        ].join('\n');
      } else {
        text = [
          `Hi ${name},`,
          '',
          `Your ${bike} is ready to go. We'll deliver it on ${returnDate}.`,
          '',
          `Track your service: ${link}`,
          '',
          '— One Love Outdoors',
        ].join('\n');
      }
      break;
    }

    default:
      return;
  }

  console.log('[email] Sending', trigger, '→', booking.email, '| subject:', subject);
  try {
    const result = await resend.emails.send({ from: FROM, to: [booking.email], subject, text });
    console.log('[email] Resend response:', JSON.stringify(result));
  } catch (err) {
    console.error('[email] Failed to send', trigger, 'email to', booking.email, ':', err?.message || err);
  }
}

/**
 * Send a new booking notification to the admin.
 */
export async function sendNewBookingNotification(booking) {
  console.log('[email] sendNewBookingNotification — booking id:', booking?.id, '| resend ready:', !!resend, '| KEY present at call time:', !!process.env.RESEND_API_KEY, '| admin target:', ADMIN_EMAIL);
  if (!resend) { console.error('[email] RESEND_API_KEY missing at call time — skipping admin notification'); return; }

  const name      = booking.name || 'Unknown';
  const bike      = booking.bike_brand || 'not specified';
  const issues    = Array.isArray(booking.issues) && booking.issues.length ? booking.issues.join(', ') : 'none';
  const preferred = [booking.preferred_day, booking.time_slot].filter(Boolean).join(', ') || 'none';

  const lines = [
    'New service request:',
    '',
    `Name: ${name}`,
    `Phone: ${booking.phone || '—'}`,
    `Email: ${booking.email || '—'}`,
    `Address: ${booking.address || '—'}`,
    `Bike: ${bike}`,
    `Issues: ${issues}`,
    `Preferred: ${preferred}`,
    `Contact via: ${booking.contact_preference || '—'}`,
    `Notes: ${booking.notes || '—'}`,
  ];

  if (booking.bike_details) {
    lines.push(`Bike details: ${booking.bike_details}`);
  }

  lines.push('', `View in admin: ${BASE_URL}/admin/service`, '', '— One Love Outdoors');

  const subject = `New booking — ${name} (${bike})`;
  const text = lines.join('\n');

  console.log('[email] Sending new booking notification | subject:', subject);
  try {
    const result = await resend.emails.send({ from: FROM, to: [ADMIN_EMAIL], subject, text });
    console.log('[email] New booking notification sent:', JSON.stringify(result));
  } catch (err) {
    console.error('[email] Failed to send new booking notification:', err?.message || err);
  }
}

/**
 * Send a "new customer message" notification to the admin.
 * booking: { name, bike_brand, issues }
 * messageText: the message body
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
        '',
        '— One Love Outdoors',
      ].filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n'),
    });
  } catch (err) {
    console.error('[email] Failed to send admin message notification:', err?.message || err);
  }
}

/**
 * Send a "new message from admin" notification to the customer.
 * booking: { id, name, email }
 * messageText: the message body
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
        `New message from One Love: ${messageText}`,
        '',
        `Reply here: ${link}`,
        '',
        '— One Love Outdoors',
      ].join('\n'),
    });
  } catch (err) {
    console.error('[email] Failed to send message notification to', booking.email, ':', err?.message || err);
  }
}
