const KEY = 'ol_pwa_bookings';

export function getSavedBookingIds() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveBookingId(id) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getSavedBookingIds();
    if (!ids.includes(id)) localStorage.setItem(KEY, JSON.stringify([...ids, id]));
  } catch {}
}
