'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  {
    number: '01',
    heading: `It started with a shop.`,
    body: `We had a bike shop in Connecticut. Saturday mornings with the door open and coffee going. Someone's kid getting their first real bike. Regulars who came for the ride, stayed for the conversation. That's what a bike shop actually is — not a store, but a place where the thing you love happens with other people who love it too.`,
  },
  {
    number: '02',
    heading: `Then the math changed.`,
    body: `After COVID, the biggest players in the bike industry made a bet: flood the market, grab market share, figure out the damage later. It worked for their quarterly earnings. It destroyed everything else. Shops closed. Mechanics left the trade. Brands that used to stand for something became logos on a spreadsheet. The gimmicky fad replaced the refined thing. And the community that built this whole industry? Collateral damage.`,
  },
  {
    number: '03',
    heading: `We started paying attention.`,
    body: `After our shop closed, we had time to look around. And we noticed the same pattern everywhere. Not just bikes. Healthcare. Food. Banking. The outdoor industry. Every sector had the same shape: consolidation, extraction, a PR layer to make it look like progress. The information was all public — SEC filings, FEC databases, corporate ownership records. It just wasn't meant to be readable.`,
  },
  {
    number: '04',
    heading: `We don't have all the answers.`,
    body: `We're bike people, not economists. But we know what we saw from behind the counter for fifteen years. And we think the question worth asking isn't whether things are broken — most people can feel that — but whether the way we spend our money is one of the last levers we actually have.\n\nCan a culture that turned everything into a transaction learn to value something beyond the transaction? We don't know. But we think a Saturday morning ride that starts with coffee and ends with a beer might be more important than anyone gives it credit for. And we think the shop where that happens is worth fighting for.`,
  },
  {
    number: '05',
    heading: `That's what this is.`,
    body: `A free tool to help you find a bike and a shop worth caring about.\nA small operation that builds things by hand because we think that matters.\nA bet that enough people feel the same way.\n\nLove over money. Always.`,
  },
];

export default function WhyPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-10 max-w-2xl mx-auto">

        {/* Hero */}
        <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <div className="text-xs font-bold tracking-[3px] uppercase mb-3" style={{ color: '#2d8653' }}>
            One Love Outdoors
          </div>
          <h1 className="text-3xl font-black mb-4 leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: '#2d3436' }}>
            Why We Do This
          </h1>
          <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: '#9ca3af' }}>
            The long answer. Read it when you have a few minutes.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8 mb-12">
          {SECTIONS.map((section, i) => (
            <div
              key={section.number}
              className={`transition-all duration-700`}
              style={{ transitionDelay: `${i * 80}ms`, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)' }}
            >
              <div className="flex gap-5">
                <div className="text-xs font-black font-mono shrink-0 pt-1" style={{ color: '#a3d9b5', width: 24 }}>
                  {section.number}
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-3 leading-snug" style={{ fontFamily: 'Playfair Display, serif', color: '#2d3436' }}>
                    {section.heading}
                  </h2>
                  {section.body.split('\n\n').map((para, j) => (
                    <p key={j} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: '#4a5568' }}>
                      {para.split('\n').map((line, k, arr) => (
                        <span key={k}>
                          {line}
                          {k < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
              {i < SECTIONS.length - 1 && (
                <div className="ml-11 mt-8 border-t" style={{ borderColor: '#f0ede8' }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mb-10 px-4 py-8 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: '#636e72' }}>
            The app is free forever. Custom builds and memberships fund trail work, community rides, and keeping this running.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <a href="/"
              className="block text-center py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #2d8653, #1a6e3f)' }}>
              Find your bike →
            </a>
            <a href="/custom-builds"
              className="block text-center py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#f6fbf8', color: '#2d8653', border: '1px solid #d1ead9' }}>
              Custom builds →
            </a>
            <a href="/membership"
              className="block text-center py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#faf9ff', color: '#9333ea', border: '1px solid #e0d9f7' }}>
              Membership →
            </a>
          </div>
        </div>

        <div className="text-center pb-6">
          <p className="mb-3 max-w-sm mx-auto" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#636e72', fontSize: '0.82rem', lineHeight: 1.6 }}>
            Love over money. Always.
          </p>
          <div className="text-[10px]" style={{ color: '#c4bdb5' }}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
        </div>
      </div>
    </div>
  );
}
