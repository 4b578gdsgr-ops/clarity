import './globals.css';

export const metadata = {
  metadataBase: new URL('https://loveovermoney.oneloveoutdoors.org'),
  title: 'Love Over Money — Know What Your Money Supports',
  description: 'Search any company to see their true impact. Political spending, karma score, foreign ties, and corporate ownership. A One Love Outdoors project.',
  keywords: 'ethical shopping, corporate transparency, karma score, political spending, bike industry, outdoor industry',
  openGraph: {
    title: 'Love Over Money',
    description: 'Know what your money supports. Search any company to see political spending, karma score, foreign ties, and corporate ownership.',
    type: 'website',
    url: 'https://loveovermoney.oneloveoutdoors.org',
    siteName: 'Love Over Money',
  },
  twitter: {
    card: 'summary',
    title: 'Love Over Money',
    description: 'Know what your money supports.',
  },
  alternates: {
    canonical: 'https://loveovermoney.oneloveoutdoors.org',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
