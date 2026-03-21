'use client';

const CHECKOUT_URL = 'https://square.link/u/cQHbqSTS';
const SERVICE_PAGE_URL = 'https://oneloveoutdoors.org/schedule-service-app';

const PERKS = [
  `Direct line to a real mechanic who actually rides`,
  `Free pickup and dropoff — we come to you`,
  `Priority service — your bike doesn't wait in a queue`,
  `Seasonal tune-up included — we'll remind you`,
  `Preferred pricing on parts — we source smart and pass the savings along`,
  `Full suspension service in-house — fork and shock rebuilds, personalized setup for your weight and riding style`,
  `You're funding trail work, community rides, and keeping this tool free for everyone`,
];

const FAQ = [
  { q: 'Where is One Love based?', a: 'Connecticut. Service memberships are for CT riders.' },
  { q: 'When does billing start?', a: 'Billing starts when you join through Square. Cancel anytime from your Square account.' },
  { q: "What if I don't like it?", a: 'Cancel anytime. No contracts. We believe in earning your loyalty, not locking you in.' },
];

export default function EmbedMembership() {
  return (
    <div style={{ fontFamily: 'var(--ol-font-body)', background: 'var(--ol-bg)', color: 'var(--ol-text)', padding: '20px 16px 40px', maxWidth: 560, margin: '0 auto' }}>

      <button
        onClick={() => history.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ol-text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 500, marginBottom: 24, fontFamily: 'var(--ol-font-body)' }}
      >
        ← Back
      </button>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ol-accent)', marginBottom: 8 }}>
        One Love Membership
      </p>
      <h1 style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--ol-text)', lineHeight: 1.3, marginBottom: 8, marginTop: 0 }}>
        This is how we keep the lights on without selling out.
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ol-text-muted)', lineHeight: 1.6, marginBottom: 4 }}>
        No ads. No investors. Just riders who think this matters.
      </p>
      <p style={{ fontSize: 12, color: 'var(--ol-text-hint)', lineHeight: 1.6, marginBottom: 24 }}>
        One pickup/dropoff can run $15–40 depending on location. The membership is $25/month — free pickups, priority service, seasonal tune-up. Most people join because they want this to exist.
      </p>

      {/* Perks card */}
      <div style={{ background: 'var(--ol-accent-light)', border: '1px solid var(--ol-accent-border)', borderRadius: 'var(--ol-radius-lg)', padding: '16px 18px', marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--ol-font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--ol-text)', marginBottom: 4, marginTop: 0 }}>
          One Love Membership
        </p>
        <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: 'var(--ol-text)', marginBottom: 14, marginTop: 0 }}>
          $25/month
        </p>
        {PERKS.map((perk, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ol-accent)', flexShrink: 0, lineHeight: 1.6 }}>♥</span>
            <span style={{ fontSize: 13, color: 'var(--ol-text-muted)', lineHeight: 1.6 }}>{perk}</span>
          </div>
        ))}
      </div>

      {/* Join CTA — Square embed */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', width: 259, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '-2px 10px 5px rgba(0,0,0,0)', borderRadius: 10, fontFamily: 'SQ Market, Helvetica, Arial, sans-serif' }}>
          <div style={{ padding: 20 }}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://square.link/u/cQHbqSTS?src=embed"
              style={{ display: 'inline-block', fontSize: 18, lineHeight: '48px', height: 48, color: '#ffffff', minWidth: 212, backgroundColor: '#006aff', textAlign: 'center', boxShadow: '0 0 0 1px rgba(0,0,0,.1) inset', borderRadius: 6, textDecoration: 'none' }}
            >
              Join
            </a>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--ol-text-hint)', textAlign: 'center', marginTop: 4, marginBottom: 0 }}>
        Billed monthly through Square. Cancel anytime.
      </p>

      {/* FAQ */}
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ol-text-hint)', textAlign: 'center', marginBottom: 12, marginTop: 28 }}>
        Common questions
      </p>
      {FAQ.map(item => (
        <div key={item.q} style={{ background: 'var(--ol-bg-callout)', border: '1px solid var(--ol-border)', borderRadius: 'var(--ol-radius-md)', padding: '10px 14px', marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ol-text)', marginBottom: 3, marginTop: 0 }}>{item.q}</p>
          <p style={{ fontSize: 12, color: 'var(--ol-text-muted)', lineHeight: 1.5, margin: 0 }}>{item.a}</p>
        </div>
      ))}

      {/* Book service CTA */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--ol-border)' }}>
        <p style={{ fontSize: 13, color: 'var(--ol-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: 14, marginTop: 0 }}>
          Ready to book? Members get free pickup and priority scheduling.
        </p>
        <a
          href={SERVICE_PAGE_URL}
          target="_top"
          style={{ display: 'block', width: '100%', padding: '13px 0', borderRadius: 'var(--ol-radius-md)', fontSize: 15, fontWeight: 700, color: 'var(--ol-btn-text)', background: 'var(--ol-btn-bg)', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
        >
          Book a service →
        </a>
      </div>

    </div>
  );
}
