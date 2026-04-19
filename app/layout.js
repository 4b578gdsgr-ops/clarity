import './globals.css';
import 'leaflet/dist/leaflet.css';
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';

export const metadata = {
  metadataBase: new URL('https://service.oneloveoutdoors.org'),
  title: 'One Love Outdoors — Mobile Bike Service',
  description: 'Mobile bike service in Hartford and Tolland County, CT. We pick up, fix, and deliver.',
  keywords: 'bike service, mobile bike repair, bicycle pickup, Hartford CT, Tolland CT',
  openGraph: {
    title: 'One Love Outdoors — Mobile Bike Service',
    description: 'Mobile bike service — we pick up, fix, and deliver.',
    type: 'website',
    url: 'https://service.oneloveoutdoors.org',
    siteName: 'One Love Outdoors',
  },
  twitter: {
    card: 'summary',
    title: 'One Love Outdoors',
    description: 'Mobile bike service — pickup, repair, delivery.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'One Love',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#1a3328',
  },
};

export const viewport = {
  themeColor: '#1a3328',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen">
        <ServiceWorkerRegistrar />
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
