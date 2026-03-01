import Link from 'next/link';
import { getCompanyById } from '../../../lib/companies';
import CompanyResult from '../../components/CompanyResult';

function fmt(a) {
  if (a >= 1e6) return `$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(a / 1e3).toFixed(0)}K`;
  return `$${a}`;
}

export async function generateMetadata({ params }) {
  const company = getCompanyById(params.id);
  if (!company) {
    return { title: 'Company Not Found — Love > Money' };
  }

  const kLabel = company.karmaScore >= 75 ? 'Force for Good'
    : company.karmaScore >= 50 ? 'Mixed Impact'
    : company.karmaScore >= 25 ? 'Mostly Harmful' : 'Harmful';
  const spending = fmt(company.totalPoliticalSpending);
  const url = `https://lovemoney.oneloveoutdoors.org/company/${params.id}`;

  return {
    title: `${company.name} · Karma ${company.karmaScore}/100 — Love > Money`,
    description: `${company.name} karma score: ${company.karmaScore}/100 (${kLabel}). Political spending: ${spending}. Opacity: ${company.opacityScore}/100. See what your money really supports.`,
    openGraph: {
      title: `${company.name} · Karma ${company.karmaScore}/100`,
      description: `${kLabel}. Political spending: ${spending}. Opacity: ${company.opacityScore}/100. See the full breakdown — Love > Money.`,
      type: 'article',
      url,
      siteName: 'Love > Money',
    },
    twitter: {
      card: 'summary',
      title: `${company.name} · Karma ${company.karmaScore}/100`,
      description: `${kLabel}. Political spending: ${spending}. See what your money really supports — lovemoney.oneloveoutdoors.org`,
    },
    alternates: { canonical: url },
  };
}

export default function CompanyPage({ params }) {
  const company = getCompanyById(params.id);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%, #0d2818, #0f1a14 70%)'}} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold tracking-wider uppercase transition-colors"
            style={{color:'#4a6b52'}}
            onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a6b52'}>
            ← Love &gt; Money
          </Link>
          <span className="text-[10px]" style={{color:'#2a4a38'}}>A One Love Outdoors project · 501(c)(3)</span>
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
  );
}
