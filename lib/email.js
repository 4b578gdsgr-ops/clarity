import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
  if (!resend || !booking.email) return;

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

  try {
    await resend.emails.send({ from: FROM, to: [booking.email], subject, text });
  } catch (err) {
    console.error('[email] Failed to send', trigger, 'email to', booking.email, ':', err?.message || err);
  }
}

/**
 * Send a "new customer message" notification to the admin.
 * booking: { name, bike_brand, issues }
 * messageText: the message body
 */
export async function sendAdminMessageNotification(booking, messageText) {
  if (!resend) return;

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
        '— Love Over Money',
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
  if (!resend || !booking.email) return;

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
