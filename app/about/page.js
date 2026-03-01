import Link from 'next/link';

export const metadata = {
  title: 'Why This Exists — Love Over Money',
  description: 'The story behind Love Over Money. A bike shop owner in Connecticut on corporate consolidation, money in politics, and why transparency matters.',
  alternates: { canonical: 'https://loveovermoney.oneloveoutdoors.org/about' },
};

function P({ children, className = '' }) {
  return (
    <p className={`text-sm leading-relaxed mb-4 ${className}`} style={{color:'#4a5568'}}>
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
        <div className="rounded-2xl p-6 mb-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.05)'}}>

          <P>I had a bike shop in Connecticut. Before I tell you what happened to it, I want to tell you what it actually was.</P>

          <P>It was Saturday mornings with the door propped open and coffee going, someone's kid getting their first real bike fit. It was knowing which local trail had washed out after Thursday's rain and being the person the whole community called to find out. It was my mechanic — six years at the shop, knew every customer by name, could true a wheel by feel in three minutes flat. It was a junior mountain bike team we'd helped build from nothing, kids who'd never been in the woods learning that their bodies could do hard things.</P>

          <P>We weren't selling bikes. We were a place where the outdoor community actually happened.</P>

          <P>Then it was gone.</P>

          <P>Not dramatically. There wasn't one villain and one bad day. There was a pandemic, a lease renewal, some genuinely bad timing. But there was also something that had been building for years before any of that — something I'd been watching but hadn't quite named. The industry had been quietly consolidating. Brands we'd believed in were getting absorbed into holding companies we'd never heard of. Online retailers with warehouse economics were pricing us out of categories we'd spent years earning customer trust in. Private equity was buying up distributors. The companies that used to sponsor local rides started sponsoring influencers instead.</P>

          <P>The economics of community kept losing to the economics of scale.</P>

          <P>After the shop closed I had a lot of time to sit with that. And I started noticing the same pattern everywhere I looked — not just in cycling. The outdoor industry. Healthcare. Food. Finance. Banking. Every sector I examined had the same shape: a handful of large players, enormous political spending to keep it that way, and a PR layer designed to make it look like consumer choice when it was really market capture.</P>

          <P>I'm not a conspiracy theorist. I don't think there's a room where executives coordinate. I think there's something more mundane and more powerful: an economic logic that rewards consolidation, punishes independence, and is invisible to most people because the information is technically public but practically buried in SEC filings and FEC databases that nobody has time to read.</P>

          <P>That's what bothered me most. The information exists. It's just designed, unintentionally or not, to be inaccessible.</P>

          <P>So I started One Love Outdoors — a 501(c)(3) built around the idea that the outdoor community has always been good at taking care of each other, and that caring for each other now means caring about the systems our money moves through. Trail work. Rides for people who don't feel welcome in the sport yet. And now this: a tool to make the money trail readable for anyone who wants to look.</P>

          <P>I'm not trying to tell anyone what to buy. I still ride components made overseas. I shop online sometimes. I'm not here to make anyone feel guilty. I'm here because I spent fifteen years in a small business in Connecticut watching the slow physics of how large money moves, and I think people deserve to see it — clearly, honestly, without a political agenda attached.</P>

          <P>The Karma Score isn't perfect. The data has gaps. I make judgment calls and I document them so you can disagree. I update scores when I'm wrong. I'm one person with a laptop and a genuine belief that the community that taught me to love the outdoors is worth fighting for with whatever tools I have.</P>

          <P>This tool exists because we believe the complexity of how our buying choices affect the world tomorrow shouldn't be hidden behind corporate PR.</P>

          <P className="font-semibold" style={{color:'#2d3436', fontFamily:'Playfair Display, serif', fontSize:'15px'}}>
            Love over money. Always.
          </P>

        </div>

        {/* Links card */}
        <div className="rounded-2xl p-5 mb-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.05)'}}>
          <div className="text-[10px] font-extrabold tracking-[2px] uppercase mb-4" style={{color:'#9ca3af'}}>One Love Outdoors</div>
          <P>One Love Outdoors is a 501(c)(3) nonprofit based in Connecticut. We run trail programs, community rides, and youth outdoor access initiatives across the Northeast. Love Over Money is one part of what we do.</P>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <a href="https://oneloveoutdoors.org" target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-bold"
              style={{background:'#faf9f6', border:'1px solid #e5e0d8', color:'#2d8653'}}>
              Visit oneloveoutdoors.org →
            </a>
            <a href="https://www.paypal.com/donate?token=CVMQXpC4Y4SF0ukiHSLS3V-Msw4syFCNKFF6RQBn6H7F1FqpSH4W1uriTp_sewt1T8moT7FzP7eQPShz" target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{background:'linear-gradient(135deg, #2d8653, #1a6e3f)'}}>
              ♥ Support the work
            </a>
          </div>
        </div>

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
