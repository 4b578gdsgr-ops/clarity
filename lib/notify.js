/**
 * notify.js — customer notification helpers
 *
 * Automated customer notifications:
 * 1. New booking submitted → "we got your request" email
 * 2. Admin sends a message → email with message content
 * 3. Completed booking marked paid → Google review ask email
 *
 * All three only fire when contact_preference === 'email'.
 * Text/phone-preference customers get no automated notifications —
 * admin uses copy text buttons and pastes into Google Voice.
 */

import { sendNewBookingEmail, sendMessageEmail, sendReviewRequestEmail } from './email';

export async function notifyCustomerNewBooking(booking) {
  if (booking.contact_preference !== 'email') return;
  await sendNewBookingEmail(booking);
}

export async function notifyCustomerMessage(booking, messageText) {
  if (booking.contact_preference !== 'email') return;
  await sendMessageEmail(booking, messageText);
}

export async function notifyCustomerReviewAsk(booking) {
  if (booking.contact_preference !== 'email') return;
  await sendReviewRequestEmail(booking);
}
