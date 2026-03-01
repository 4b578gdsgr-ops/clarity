import './globals.css';

export const metadata = {
  title: 'Love > Money — Know What Your Money Supports',
  description: 'Search any company to see their true impact. Political spending, karma score, foreign ties, and corporate ownership. A One Love Outdoors project.',
  keywords: 'ethical shopping, corporate transparency, karma score, political spending, bike industry, outdoor industry',
  openGraph: {
    title: 'Love > Money — Know What Your Money Supports',
    description: 'Search any company. See where the money really goes. Choose love over greed.',
    type: 'website',
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
