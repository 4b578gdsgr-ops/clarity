import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata = {
  metadataBase: new URL('https://loveovermoney.oneloveoutdoors.org'),
  title: 'Love Over Money — Find Your Bike, Find Your Shop',
  description: 'Find the right bike and a local shop that can help. A One Love Outdoors project.',
  keywords: 'bike finder, local bike shop, ethical shopping, corporate transparency, karma score, outdoor industry',
  openGraph: {
    title: 'Love Over Money',
    description: 'Find the right bike and a local shop near you.',
    type: 'website',
    url: 'https://loveovermoney.oneloveoutdoors.org',
    siteName: 'Love Over Money',
  },
  twitter: {
    card: 'summary',
    title: 'Love Over Money',
    description: 'Find the right bike and a local shop near you.',
  },
  alternates: {
    canonical: 'https://loveovermoney.oneloveoutdoors.org',
  },
};

function TopNav() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(250,249,246,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e0d8',
    }}>
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '0 1rem', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '1rem', textDecoration: 'none', letterSpacing: '-0.01em' }}>
          L❤️ve &gt; M💰ney
        </a>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <a href="/find-a-shop" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>
            Find a Shop
          </a>
          <a href="/fix-or-ride" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>
            Fix or Ride?
          </a>
          <a href="/custom-builds" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>
            Custom Builds
          </a>
          <a href="/membership" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>
            Membership
          </a>
          <a href="/schedule-service" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>
            Schedule Service
          </a>
          <a href="/why" style={{ fontSize: '0.75rem', color: '#636e72', textDecoration: 'none' }}>
            Why We Do This
          </a>
          <a href="/about" style={{ fontSize: '0.75rem', color: '#636e72', textDecoration: 'none' }}>
            About
          </a>
          <a href="/corporate" style={{ fontSize: '0.7rem', color: '#b0b8b4', textDecoration: 'none' }}>
            Corporate
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
