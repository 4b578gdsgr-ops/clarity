import Link from 'next/link';
import { getCompanyById } from '../../../lib/companies';
import CompanyResult from '../../components/CompanyResult';

const BASE_URL = 'https://loveovermoney.oneloveoutdoors.org';

function fmt(a) {
  if (a >= 1e6) return `$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(a / 1e3).toFixed(0)}K`;
  return `$${a}`;
}

export async function generateMetadata({ params }) {
  const company = getCompanyById(params.id);
  if (!company) {
    return { title: 'Company Not Found — Love Over Money' };
  }

  const url = `${BASE_URL}/company/${params.id}`;
  const title = `${company.name} Karma Score — Love Over Money`;
  const description = `${company.name} has a Karma Score of ${company.karmaScore}/100. See their political spending, foreign ties, and ethical alternatives.`;
  const spending = fmt(company.totalPoliticalSpending);
  const kLabel = company.karmaScore >= 75 ? 'Force for Good'
    : company.karmaScore >= 50 ? 'Mixed Impact'
    : company.karmaScore >= 25 ? 'Mostly Harmful' : 'Harmful';

  return {
    title,
    description,
    openGraph: {
      title: `${company.name} · Karma ${company.karmaScore}/100 · ${kLabel}`,
      description: `Political spending: ${spending}. Opacity: ${company.opacityScore}/100. ${description}`,
      type: 'article',
      url,
      siteName: 'Love Over Money',
    },
    twitter: {
      card: 'summary',
      title: `${company.name} · Karma ${company.karmaScore}/100`,
      description,
    },
    alternates: { canonical: url },
  };
}

export default function CompanyPage({ params }) {
  const company = getCompanyById(params.id);
  const url = `${BASE_URL}/company/${params.id}`;

  const jsonLd = company ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: `${company.name} has a Karma Score of ${company.karmaScore}/100 on Love Over Money. Political spending: ${fmt(company.totalPoliticalSpending)}. Opacity score: ${company.opacityScore}/100.`,
    url,
    sameAs: url,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="min-h-screen relative">
        <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%, #0d2818, #0f1a14 70%)'}} />
        <div className="fixed inset-0 nature-bg pointer-events-none" />

        <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-xs font-bold tracking-wider uppercase"
              style={{color:'#4a6b52'}}>
              ← Love Over Money
            </Link>
            <span className="text-[10px]" style={{color:'#2a4a38'}}>A One Love Outdoors 501(c)(3) project</span>
          </div>

          {company ? (
            <CompanyResult data={company} />
          ) : (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🌱</div>
              <h2 className="text-white text-lg font-bold mb-2">Company not found</h2>
              <p className="text-sm mb-6" style={{color:'#6b8f71'}}>We don't have data on this one yet.</p>
              <Link href="/" className="px-5 py-2.5 rounded-lg text-white text-sm font-bold"
                style={{background:'linear-gradient(135deg, #166534, #15803d)'}}>
                Search all companies
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
