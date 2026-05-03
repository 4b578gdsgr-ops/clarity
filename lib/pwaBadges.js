const BOOKING_SEEN_KEY = 'ol_booking_seen';
const MESSAGES_SEEN_KEY = 'ol_messages_seen';

export function getBookingSeen() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(BOOKING_SEEN_KEY) || '{}'); } catch { return {}; }
}

export function markBookingsSeen(bookings) {
  if (typeof window === 'undefined') return;
  const seen = getBookingSeen();
  for (const b of bookings) seen[b.id] = b.status;
  try { localStorage.setItem(BOOKING_SEEN_KEY, JSON.stringify(seen)); } catch {}
}

export function getMessagesSeenAt() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(MESSAGES_SEEN_KEY) || null;
}

export function markMessagesSeen() {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(MESSAGES_SEEN_KEY, new Date().toISOString()); } catch {}
}
