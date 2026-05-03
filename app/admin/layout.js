// Admin pages need standalone PWA mode for the admin home screen shortcut.
export const metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'One Love Admin',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function AdminLayout({ children }) {
  return children;
}
