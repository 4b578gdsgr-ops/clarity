// Suppress PWA manifest on all admin pages so /admin/* URLs are not captured
// by the PWA install and open as normal browser pages.
export const metadata = {
  manifest: null,
};

export default function AdminLayout({ children }) {
  return children;
}
