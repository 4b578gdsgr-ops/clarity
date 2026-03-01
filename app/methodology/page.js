import Link from 'next/link';

export const metadata = {
  title: 'How We Score Companies — Love Over Money Methodology',
  description: 'How Love Over Money calculates Karma Scores and Opacity Scores. Data sources, editorial process, and scoring philosophy.',
  alternates: { canonical: 'https://loveovermoney.oneloveoutdoors.org/methodology' },
};

function Card({ children }) {
  return (
    <div className="rounded-2xl p-6 mb-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.05)'}}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-lg font-extrabold mb-4" style={{fontFamily:'Playfair Display, serif', color:'#2d3436'}}>
      {children}
    </h2>
  );
}

function CategoryRow({ icon, name, description }) {
  return (
    <div className="flex gap-3 py-3" style={{borderBottom:'1px solid #f0ede8'}}>
      <span className="text-xl w-7 flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-sm font-bold mb-0.5" style={{color:'#2d3436'}}>{name}</div>
        <div className="text-xs leading-relaxed" style={{color:'#636e72'}}>{description}</div>
      </div>
    </div>
  );
}

function Source({ name, url, description }) {
  return (
    <div className="py-2.5" style={{borderBottom:'1px solid #f0ede8'}}>
      <div className="text-xs font-bold mb-0.5" style={{color:'#2d8653'}}>{name}</div>
      <div className="text-xs" style={{color:'#636e72'}}>{description}</div>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)'}} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">

        {/* Nav */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold tracking-wider uppercase" style={{color:'#2d8653'}}>
            ← Love Over Money
          </Link>
          <span className="text-[10px]" style={{color:'#9ca3af'}}>A One Love Outdoors 501(c)(3) project</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2" style={{fontFamily:'Playfair Display, serif', color:'#2d3436'}}>
            How We Score Companies
          </h1>
          <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{color:'#636e72'}}>
            Our scoring is based on publicly verifiable facts, applied with honest editorial judgment.
            No algorithm. No black box. Just research and transparency.
          </p>
        </div>

        {/* Karma Score */}
        <Card>
          <SectionTitle>The Karma Score (0–100)</SectionTitle>
          <p className="text-sm leading-relaxed mb-5" style={{color:'#636e72'}}>
            The Karma Score is the average of five equally weighted categories, each scored
            from 0 to 100. A score of 100 represents a hypothetical ideal — no company scores
            perfectly. A score below 25 indicates significant documented harm.
          </p>
          <div className="rounded-xl overflow-hidden mb-4" style={{border:'1px solid #e5e0d8'}}>
            <div className="px-4 py-2.5 text-[10px] font-extrabold tracking-[2px] uppercase" style={{background:'#faf9f6', color:'#9ca3af'}}>
              The Five Categories — 20% each
            </div>
            <div className="px-4">
              <CategoryRow
                icon="🌿"
                name="Environment"
                description="Climate commitments vs. actual emissions. EPA violations. Fossil fuel investments. Supply chain environmental impact. Recycling and end-of-life programs."
              />
              <CategoryRow
                icon="🤝"
                name="Workers"
                description="Wages relative to industry. Benefits and healthcare coverage. Union relations. Layoff history. Workplace safety record. Employee reviews and culture."
              />
              <CategoryRow
                icon="🏡"
                name="Community"
                description="Investment in local economies. Charitable giving and advocacy. Support for small businesses and independent retailers. Civic engagement. Tax payment in communities served."
              />
              <CategoryRow
                icon="⚖️"
                name="Ethics"
                description="Legal and regulatory record. DOJ and SEC settlements. History of consumer harm. Product safety. Executive conduct. Conflicts of interest."
              />
              <CategoryRow
                icon="🔍"
                name="Transparency"
                description="Quality of public disclosure. Honest reporting of environmental and social data. Clarity of ownership structure. Political spending disclosure beyond legal minimums."
              />
            </div>
          </div>
          <div className="text-xs p-3 rounded-lg" style={{background:'#f6fbf8', border:'1px solid #d1ead9', color:'#2d8653'}}>
            <strong>Karma Score = (Environment + Workers + Community + Ethics + Transparency) ÷ 5</strong>
          </div>
        </Card>

        {/* Opacity Score */}
        <Card>
          <SectionTitle>The Opacity Score (0–100)</SectionTitle>
          <p className="text-sm leading-relaxed mb-4" style={{color:'#636e72'}}>
            The Opacity Score measures how difficult it is to trace a company's money trail —
            its political spending, ownership structure, and true financial relationships.
            Lower is better. A score of 0 means the company is fully transparent.
            A score of 100 means it is almost impossible to follow where the money goes.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { range: '0–25', label: 'Transparent', desc: 'Easy to trace. Proactive disclosure. Full data available.', color: '#22c55e' },
              { range: '26–50', label: 'Semi-Opaque', desc: 'Some gaps. Data exists but requires digging.', color: '#84cc16' },
              { range: '51–75', label: 'Opaque', desc: 'Significant gaps. Complex structures obscure the picture.', color: '#f59e0b' },
              { range: '76–100', label: 'Very Opaque', desc: 'Hard to trace. Shell companies, offshore accounts, or minimal disclosure.', color: '#ef4444' },
            ].map(tier => (
              <div key={tier.range} className="p-3 rounded-lg" style={{background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                <div className="text-xs font-extrabold font-mono mb-1" style={{color: tier.color}}>{tier.range}</div>
                <div className="text-xs font-bold mb-1" style={{color:'#2d3436'}}>{tier.label}</div>
                <div className="text-[11px] leading-snug" style={{color:'#636e72'}}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Editorial nature */}
        <Card>
          <SectionTitle>Editorial Scores, Not Algorithms</SectionTitle>
          <p className="text-sm leading-relaxed mb-3" style={{color:'#636e72'}}>
            These scores are not produced by an algorithm. They are editorial assessments —
            human judgment applied to publicly verifiable facts. We document our reasoning
            in the "What They Actually Do" section of each company's profile so you can
            agree, disagree, or do your own research.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{color:'#636e72'}}>
            We try to be fair. A company with a genuinely great environmental record gets
            credit for it even if we disagree with other practices. A company that has made
            real improvements gets credit for that trajectory. Scores reflect conditions at
            the time of last review — not permanent verdicts.
          </p>
          <p className="text-sm leading-relaxed" style={{color:'#636e72'}}>
            We are not anti-business. We are pro-accountability. The goal is to help you
            make informed decisions with your money, not to tell you what to buy.
          </p>
        </Card>

        {/* Local shop philosophy */}
        <Card>
          <SectionTitle>Local Shops, Online Retailers & Full Community Impact</SectionTitle>
          <p className="text-sm leading-relaxed mb-3" style={{color:'#636e72'}}>
            When scoring retailers — especially in cycling and outdoor — we consider the
            full community impact of a business model, not just whether the product is
            good or the price is low.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{color:'#636e72'}}>
            A local bike shop employs a mechanic who knows your name, sponsors the Thursday
            night ride, donates to the trail crew, and keeps money circulating in your
            town. An online retailer that undercuts that shop on price by 15% may save one
            buyer $80 while destroying thousands of dollars of economic activity, community
            knowledge, and social infrastructure.
          </p>
          <p className="text-sm leading-relaxed" style={{color:'#636e72'}}>
            We net this out in Community and Ethics scores. A cheaper price that eliminates
            local jobs and expertise is not a neutral transaction — it has a cost that
            doesn't appear on the receipt. We try to make that cost visible.
          </p>
          <div className="mt-4 p-3 rounded-lg text-xs leading-relaxed" style={{background:'#faf9f6', border:'1px solid #e5e0d8', color:'#636e72'}}>
            This does not mean online retail is always bad. It means we score the whole picture:
            ownership, labor practices, community investment, and systemic impact — not just price.
          </div>
        </Card>

        {/* Data sources */}
        <Card>
          <SectionTitle>Data Sources</SectionTitle>
          <p className="text-sm leading-relaxed mb-4" style={{color:'#636e72'}}>
            Every material claim in a company profile is based on at least one of the
            following public sources. We do not use anonymous tips or unverified allegations.
          </p>
          <div>
            <Source name="FEC.gov — Federal Election Commission" description="Campaign finance disclosures: PAC contributions, individual donations, and independent expenditures by corporations and their executives." />
            <Source name="OpenSecrets.org" description="Aggregated lobbying spend, revolving door data, and political spending analysis compiled from FEC and Senate Lobbying Disclosure Act filings." />
            <Source name="SEC EDGAR" description="Institutional ownership (13F filings), annual reports (10-K), proxy statements, and material event disclosures (8-K) for publicly traded companies." />
            <Source name="EPA Enforcement & Compliance" description="Environmental violations, fines, consent decrees, and Superfund site liability records." />
            <Source name="DOJ / CFPB / FTC Settlement Records" description="Formal regulatory actions, consent orders, and settlement amounts — all public record." />
            <Source name="Corporate Sustainability & Annual Reports" description="Company-published ESG reports, B Corp certifications, and shareholder letters — weighted appropriately given the source." />
            <Source name="FARA — Foreign Agents Registration Act" description="Disclosures of relationships with foreign governments, state-owned enterprises, and foreign principals." />
            <Source name="Verified news and court records" description="Investigative journalism from established outlets (Reuters, WSJ, NYT, ProPublica) and court filings for documented controversies." />
          </div>
        </Card>

        {/* Corrections */}
        <Card>
          <SectionTitle>Corrections & Updates</SectionTitle>
          <p className="text-sm leading-relaxed mb-3" style={{color:'#636e72'}}>
            We welcome corrections. If you believe a score is wrong, a fact is outdated,
            or we've missed something important, please reach out. We will review and
            update scores when presented with credible, sourced information.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{color:'#636e72'}}>
            We will not change scores in response to pressure from companies, PR firms,
            or anyone with a financial interest in the outcome. Corrections require
            documented public sources, not assertions.
          </p>
          <a href="mailto:corrections@oneloveoutdoors.org"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{background:'linear-gradient(135deg, #2d8653, #1a6e3f)'}}>
            corrections@oneloveoutdoors.org
          </a>
        </Card>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <div className="text-[10px]" style={{color:'#c4bdb5'}}>
            Love Over Money · A One Love Outdoors 501(c)(3) project
          </div>
        </div>

      </div>
    </div>
  );
}
