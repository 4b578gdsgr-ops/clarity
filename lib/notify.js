/**
 * notify.js — routes customer notifications to SMS or email
 * based on contact_preference ('text' | 'email').
 *
 * Admin notifications always go via email regardless.
 */

import { sendServiceEmail, sendMessageEmail, sendQuoteEmail } from './email';
import { sendSMS } from './sms';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';

function trackingLink(id) {
  return `${BASE_URL}/service/${id}`;
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

function bikeNoun(booking) {
  return (booking.bikes?.length || 1) > 1 ? 'bikes' : 'bike';
}
function bikeVerb(booking) {
  return (booking.bikes?.length || 1) > 1 ? 'are' : 'is';
}

function buildSMS(trigger, booking) {
  switch (trigger) {
    case 'new':
      return `One Love: Got your bicycle service booking. We'll confirm a pickup time shortly. Track: ${trackingLink(booking.id)}`;

    case 'confirmed': {
      const day  = booking.confirmed_date ? fmtDate(booking.confirmed_date) : 'the scheduled day';
      const time = booking.confirmed_time ? ' around ' + fmtTime(booking.confirmed_time) : '';
      return `One Love: Pickup confirmed ${day}${time}. We'll reach out when we're on the way.`;
    }

    case 'in_progress':
      return `One Love: Your ${bikeNoun(booking)} ${bikeVerb(booking)} with us. We'll keep you posted.`;

    case 'ready': {
      const date = booking.return_date ? fmtDate(booking.return_date) : 'soon';
      return `One Love: Your ${bikeNoun(booking)} ${bikeVerb(booking)} ready. Delivering ${date}.`;
    }

    case 'done': {
      const date = booking.return_date ? fmtDate(booking.return_date) : 'soon';
      return `One Love: Your ${bikeNoun(booking)} ${bikeVerb(booking)} ready. Delivering ${date}.`;
    }

    case 'out_for_delivery':
      return `One Love: On our way to you now.`;

    case 'complete':
      return `One Love: Delivered. You're golden.`;

    default:
      return null;
  }
}

/**
 * Notify a customer about a status change.
 * - contact_preference === 'text' or 'phone' → no auto-notification
 *   (admin sees NEEDS TEXT badge and sends manually via Google Voice)
 * - anything else → email
 *
 * Only called for 'confirmed' and 'ready' triggers — everything else
 * is handled manually or not at all.
 */
export async function notifyCustomer(trigger, booking) {
  const pref = booking.contact_preference;

  if (pref === 'text' || pref === 'phone') {
    console.log('[notify] contact_preference=' + pref + ' — skipping auto-notification for', trigger, '(admin handles manually)');
    return;
  }

  await sendServiceEmail(trigger, booking);
}

/**
 * Notify a customer that a quote/estimate is ready.
 * - text/phone: no auto-notification (admin sees badge and texts manually)
 * - email: sends quote email automatically
 */
export async function notifyCustomerQuote(booking) {
  const pref = booking.contact_preference;
  if (pref === 'text' || pref === 'phone') {
    console.log('[notify] contact_preference=' + pref + ' — skipping auto quote email (admin handles manually)');
    return;
  }
  await sendQuoteEmail(booking);
}

/**
 * Notify a customer that the admin sent them a message.
 * - contact_preference === 'text'  → SMS with tracking link
 * - anything else                  → email with message text
 */
export async function notifyCustomerMessage(booking, messageText) {
  const pref = booking.contact_preference;

  if (pref === 'text') {
    if (!booking.phone) {
      console.warn('[notify] contact_preference=text but no phone — skipping message SMS');
      return;
    }
    const link = trackingLink(booking.id);
    const smsBody = `One Love: New message about your service — ${link}`;
    try {
      await sendSMS(booking.phone, smsBody);
      console.log('[notify] message SMS sent to', booking.phone);
    } catch (err) {
      console.error('[notify] message SMS FAILED:', err?.message || err);
    }
  } else {
    await sendMessageEmail(booking, messageText);
  }
}
