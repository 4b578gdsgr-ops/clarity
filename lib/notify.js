/**
 * notify.js — customer notification helpers
 *
 * Only two automated customer notifications exist:
 * 1. New booking submitted → "we got your request" email
 * 2. Admin sends a message → email with message content
 *
 * Both only fire when contact_preference === 'email'.
 * Text/phone-preference customers get no automated notifications —
 * admin uses copy text buttons and pastes into Google Voice.
 */

import { sendNewBookingEmail, sendMessageEmail } from './email';

export async function notifyCustomerNewBooking(booking) {
  if (booking.contact_preference !== 'email') return;
  await sendNewBookingEmail(booking);
}

export async function notifyCustomerMessage(booking, messageText) {
  if (booking.contact_preference !== 'email') return;
  await sendMessageEmail(booking, messageText);
}
