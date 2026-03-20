import './globals.css';
import 'leaflet/dist/leaflet.css';
import TopNav from './components/TopNav';
import Footer from './components/Footer';

export const metadata = {
  metadataBase: new URL('https://loveovermoney.oneloveoutdoors.org'),
  title: 'One Love Outdoors — Find Your Bike, Find Your Shop',
  description: 'Find the right bike and a local shop that can help. A One Love Outdoors project.',
  keywords: 'bike finder, local bike shop, ethical shopping, corporate transparency, karma score, outdoor industry',
  openGraph: {
    title: 'One Love Outdoors',
    description: 'Find the right bike and a local shop near you.',
    type: 'website',
    url: 'https://loveovermoney.oneloveoutdoors.org',
    siteName: 'One Love Outdoors',
  },
  twitter: {
    card: 'summary',
    title: 'One Love Outdoors',
    description: 'Find the right bike and a local shop near you.',
  },
  alternates: {
    canonical: 'https://loveovermoney.oneloveoutdoors.org',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
