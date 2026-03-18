'use client';

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

export default function EmbedWhy() {
  return (
    <div style={{ fontFamily: 'var(--ol-font-body)', background: 'var(--ol-bg)', color: 'var(--ol-text)', padding: '20px 16px 40px', maxWidth: 560, margin: '0 auto' }}>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 8 }}>
        One Love Outdoors
      </p>
      <h1 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', lineHeight: 1.3, marginBottom: 8, marginTop: 0 }}>
        Why We Do This
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
        The long answer. Read it when you have a few minutes.
      </p>

      {SECTIONS.map((section, i) => (
        <div key={section.number}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: 'var(--ol-accent-border)', flexShrink: 0, width: 22, paddingTop: 3 }}>
              {section.number}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 8, marginTop: 0, lineHeight: 1.3 }}>
                {section.heading}
              </h2>
              {section.body.split('\n\n').map((para, j) => (
                <p key={j} style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.7, marginBottom: 10, marginTop: 0 }}>
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
            <div style={{ borderTop: '1px solid var(--ol-border)', marginBottom: 20, marginLeft: 36 }} />
          )}
        </div>
      ))}

      {/* Footer CTA */}
      <div style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-lg)', padding: '16px 18px', marginTop: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6, textAlign: 'center', marginBottom: 14, marginTop: 0 }}>
          Custom builds and memberships fund trail work, community rides, and keeping this tool free.
        </p>
        <a href="mailto:service@oneloveoutdoors.org" style={{ display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 15, fontWeight: 700, color: 'var(--ol-btn-text)', background: 'var(--ol-btn-bg)', textAlign: 'center', textDecoration: 'none', marginBottom: 8, boxSizing: 'border-box' }}>
          Get in touch →
        </a>
      </div>

      <p style={{ fontFamily: 'var(--ol-font-heading)', fontStyle: 'italic', fontSize: 13, color: 'var(--ol-text-hint)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
        Love over money. Always.
      </p>
    </div>
  );
}
