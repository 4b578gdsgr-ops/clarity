'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone && 'clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
  }, []);
  return null;
}
