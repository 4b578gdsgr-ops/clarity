import CryptoDonate from '../components/CryptoDonate';

export const metadata = {
  title: 'Why This Exists — One Love Outdoors',
  description: 'The story behind One Love Outdoors. A bike shop owner in Connecticut on corporate consolidation, money in politics, and why transparency matters.',
  alternates: { canonical: 'https://loveovermoney.oneloveoutdoors.org/about' },
};

function P({ children, className = '' }) {
  return (
    <p className={`mb-6 ${className}`} style={{color:'#4a5568', fontSize:'15px', lineHeight:'1.8'}}>
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)'}} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" style={{fontFamily:'Playfair Display, serif', color:'#2d3436'}}>
            Why This Exists
          </h1>
          <div className="text-xs tracking-wider uppercase" style={{color:'#9ca3af'}}>A note from the founders</div>
        </div>

        {/* Body */}
        <div className="rounded-2xl p-6 mb-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', maxWidth:'680px', margin:'0 auto 20px'}}>

          <P>We had a bike shop in Connecticut. Before we tell you what happened to it, we want to tell you what it actually was.</P>

          <P>It was Saturday mornings with the door propped open and coffee going. Someone's kid getting their first real bike. It was knowing which local trail had washed out after Thursday's rain and what was still dry. It was fixing a flat on the fly so you could make the group ride. It was the teenage employees we watched grow into men, and the lifelong friendships made along the way.</P>

          <P>We weren't selling bikes. We were the place where the outdoor community actually happened.</P>

          <P>Then it was gone.</P>

          <P>Not dramatically. There wasn't one villain or one bad day. There was a pandemic, a lease renewal, some genuinely bad timing. But there was also something that had been building for years before any of that — something we'd been watching but hadn't quite named. The industry had been quietly consolidating. Brands we believed in were getting absorbed into holding companies we'd never heard of. Online retailers with warehouse economics were pricing us out of categories we'd spent years earning customer trust in. Private equity was buying up distributors. The companies that used to sponsor local rides started sponsoring influencers instead.</P>

          <P>The economics of community kept losing to the economics of scale.</P>

          <P>After the shop closed, we had a lot of time to sit with that. And we started noticing the same pattern everywhere — not just in cycling. The outdoor industry. Healthcare. Food. Finance. Banking. Every sector we examined had the same shape: a handful of large players, enormous political spending to keep it that way, and a PR layer designed to make it look like consumer choice when it was really market capture.</P>

          <P>We might be conspiracy theorists. Maybe there is a room where elites coordinate our fate. But we think there's something more mundane and more powerful: an economic logic that rewards consolidation, punishes independence, and stays invisible to most people because the information is technically public but practically buried in SEC filings and FEC databases nobody has time to read.</P>

          <P>That's what bothered us most. The information exists. It's just designed — unintentionally or not — to be inaccessible.</P>

          <P>One Love Outdoors is a 501(c)(3) built around the idea that the outdoor community has always been good at taking care of each other, and that caring for each other now means caring about the systems our money moves through. Trail work. Rides for people who don't yet feel welcome in the sport. And now this: a tool to make the money trail readable for anyone who wants to look.</P>

          <P>We're not here to tell anyone what to buy. We still ride components made overseas. We shop online sometimes. We're not here to make anyone feel guilty. We're here because we spent fifteen years in a small business watching the slow physics of how large money moves, and we think people deserve to see it — clearly, honestly, without a political agenda attached.</P>

          <P>The Karma Score isn't perfect. The data has gaps. We make judgment calls and document them so you can disagree. We update scores when we're wrong. We're a family with a laptop and a belief that the community that taught us to love the outdoors is worth fighting for with whatever tools we have.</P>

          <P>This tool exists because the way our buying choices shape the world tomorrow shouldn't be hidden behind corporate PR.</P>

          <p style={{fontFamily:'Playfair Display, serif', fontWeight:700, color:'#2d3436', fontSize:'16px', lineHeight:'1.8', marginBottom:'24px'}}>
            — One Love Outdoors
          </p>

          <div style={{borderTop:'1px solid #e5e0d8', paddingTop:'16px'}}>
            <p style={{fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#9ca3af', marginBottom:'10px'}}>
              Donations to One Love Outdoors 501(c)(3)
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://oneloveoutdoors.org" target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-bold"
                style={{background:'#faf9f6', border:'1px solid #e5e0d8', color:'#2d8653'}}>
                Visit oneloveoutdoors.org →
              </a>
              <a href="https://www.paypal.com/donate/?hosted_button_id=M5YTUPJJDF434" target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-bold text-white"
                style={{background:'linear-gradient(135deg, #2d8653, #1a6e3f)'}}>
                Donate USD
              </a>
            </div>
          </div>

        </div>

        <CryptoDonate />


      </div>
    </div>
  );
}
