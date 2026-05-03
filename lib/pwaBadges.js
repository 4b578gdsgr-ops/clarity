const BOOKINGS_VIEWED_KEY = 'ol_bookings_viewed_at';
const MESSAGES_SEEN_KEY = 'ol_messages_seen_at';

export function getBookingsViewedAt() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BOOKINGS_VIEWED_KEY) || null;
}

export function markBookingsViewed() {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(BOOKINGS_VIEWED_KEY, new Date().toISOString()); } catch {}
}

export function getMessagesSeenAt() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(MESSAGES_SEEN_KEY) || null;
}

export function markMessagesSeen() {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(MESSAGES_SEEN_KEY, new Date().toISOString()); } catch {}
}

// Count bookings updated after last view. If never viewed, count active ones.
export function countUnreadBookings(bookings) {
  if (!bookings?.length) return 0;
  const viewedAt = getBookingsViewedAt();
  if (!viewedAt) {
    // First time: count active (non-terminal) bookings
    const ACTIVE = new Set(['new', 'confirmed', 'picked_up', 'in_progress', 'ready', 'out_for_delivery']);
    return bookings.filter(b => ACTIVE.has(b.status)).length;
  }
  const viewedTs = new Date(viewedAt).getTime();
  return bookings.filter(b => new Date(b.updated_at || b.created_at).getTime() > viewedTs).length;
}

// Count admin messages newer than last Messages open.
export function countUnreadMessages(messages) {
  if (!messages?.length) return 0;
  const seenAt = getMessagesSeenAt();
  const seenTs = seenAt ? new Date(seenAt).getTime() : 0;
  return messages.filter(m => m.sender === 'admin' && new Date(m.created_at).getTime() > seenTs).length;
}
