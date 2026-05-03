const PROFILE_KEY = 'ol_pwa_profile';
const LEGACY_KEY = 'ol_returning_user';

export function getProfile() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
}

export function saveProfile(p) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    // Keep legacy key in sync so schedule-service pre-fill still works
    localStorage.setItem(LEGACY_KEY, JSON.stringify(p));
  } catch {}
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
