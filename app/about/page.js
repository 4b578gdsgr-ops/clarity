import Link from 'next/link';
import CryptoDonate from '../components/CryptoDonate';

export const metadata = {
  title: 'Why This Exists — Love Over Money',
  description: 'The story behind Love Over Money. A bike shop owner in Connecticut on corporate consolidation, money in politics, and why transparency matters.',
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

        {/* Nav */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold tracking-wider uppercase" style={{color:'#2d8653'}}>
            ← Love Over Money
          </Link>
          <span className="text-[10px]" style={{color:'#9ca3af'}}>A One Love Outdoors 501(c)(3) project</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" style={{fontFamily:'Playfair Display, serif', color:'#2d3436'}}>
            Why This Exists
          </h1>
          <div className="text-xs tracking-wider uppercase" style={{color:'#9ca3af'}}>A note from the founder</div>
        </div>

        {/* Body */}
        <div className="rounded-2xl p-6 mb-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', maxWidth:'680px', margin:'0 auto 20px'}}>

          <P>I had a bike shop in Connecticut. Before I tell you what happened to it, I want to tell you what it actually was.</P>

          <P>It was Saturday mornings with the door propped open and coffee going, someone's kid getting their first real bike. It was knowing which local trail had washed out after Thursday's rain and what was dry. It was fixing a flat on the fly so you could make the group ride. It was the teenage employees I watched grow into men and the lifelong friendships made along the way.</P>

          <P>We weren't selling bikes. We were a place where the outdoor community actually happened.</P>

          <P>Then it was gone.</P>

          <P>Not dramatically. There wasn't one villain and one bad day. There was a pandemic, a lease renewal, some genuinely bad timing. But there was also something that had been building for years before any of that — something I'd been watching but hadn't quite named. The industry had been quietly consolidating. Brands we'd believed in were getting absorbed into holding companies we'd never heard of. Online retailers with warehouse economics were pricing us out of categories we'd spent years earning customer trust in. Private equity was buying up distributors. The companies that used to sponsor local rides started sponsoring influencers instead.</P>

          <P>The economics of community kept losing to the economics of scale.</P>

          <P>After the shop closed the first time, I had a lot of time to sit with that. And I started noticing the same pattern everywhere I looked — not just in cycling. The outdoor industry. Healthcare. Food. Finance. Banking. Every sector I examined had the same shape: a handful of large players, enormous political spending to keep it that way, and a PR layer designed to make it look like consumer choice when it was really market capture.</P>

          <P>I'm might be a conspiracy theorist. It appears there's a room where elites coordinate our fate. I think there's something also more mundane and more powerful to our framing of priorities: an economic logic that rewards consolidation, punishes independence, and is invisible to most people because the information is technically public but practically buried in SEC filings and FEC databases that nobody has time to read.</P>

          <P>That's what bothered me most. The information exists. It's just designed, unintentionally or not, to be inaccessible.</P>

          <P>One Love Outdoors — a 501(c)(3) was built around the idea that the outdoor community has always been good at taking care of each other, and that caring for each other now means caring about the systems our money moves through. Trail work. Rides for people who don't feel welcome in the sport yet. And now this: a tool to make the money trail readable for anyone who wants to look.</P>

          <P>I'm not trying to tell anyone what to buy. I still ride components made overseas. I shop online sometimes. I'm not here to make anyone feel guilty. I'm here because I spent fifteen years in a small business in Connecticut watching the slow physics of how large money moves, and I think people deserve to see it — clearly, honestly, without a political agenda attached.</P>

          <P>The Karma Score isn't perfect. The data has gaps. I make judgment calls and I document them so you can disagree. I update scores when I'm wrong. I'm one person with a laptop and a genuine belief that the community that taught me to love the outdoors is worth fighting for with whatever tools I have.</P>

          <P>This tool exists because we believe the complexity of how our buying choices affect the world tomorrow shouldn't be hidden behind corporate PR.</P>

          <p style={{fontFamily:'Playfair Display, serif', fontWeight:700, color:'#2d3436', fontSize:'16px', lineHeight:'1.8', marginBottom:'24px'}}>
            Love over money. Always.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2" style={{borderTop:'1px solid #e5e0d8'}}>
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

        <CryptoDonate />

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <div className="text-[10px]" style={{color:'#c4bdb5'}}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
          <Link href="/methodology" className="text-[10px] mt-1 inline-block hover:underline" style={{color:'#b0b8b4'}}>
            How we score companies
          </Link>
        </div>

      </div>
    </div>
  );
}
