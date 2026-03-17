'use client';

const CHECKOUT_URL = process.env.NEXT_PUBLIC_MEMBERSHIP_CHECKOUT_URL || null;

const PERKS = [
  `Direct line to a real mechanic who actually rides`,
  `Free pickup and dropoff — we come to you`,
  `Priority service — your bike doesn't wait in a queue`,
  `Seasonal tune-up included — we'll remind you`,
  `Preferred pricing on parts — we source smart and pass the savings along`,
  `Full suspension service in-house — fork rebuilds, re-valving, and setup for your weight and riding style`,
  `You're funding trail work, community rides, and keeping this tool free for everyone`,
];

const FAQ = [
  { q: 'Where is One Love based?', a: 'Connecticut. Service memberships are for CT riders.' },
  { q: 'When does billing start?', a: 'Billing starts when you join through Square. Cancel anytime from your Square account.' },
  { q: "What if I don't like it?", a: 'Cancel anytime. No contracts. We believe in earning your loyalty, not locking you in.' },
];

const s = {
  wrap: { fontFamily: 'Inter, system-ui, sans-serif', background: '#faf9f6', minHeight: '100vh', padding: '20px 16px 40px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#276749', textDecoration: 'none', fontWeight: 600, marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2d8653', marginBottom: 8 },
  h1: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 900, color: '#2d3436', lineHeight: 1.3, marginBottom: 8 },
  sub: { fontSize: 13, color: '#636e72', lineHeight: 1.6, marginBottom: 4 },
  note: { fontSize: 11, color: '#9ca3af', lineHeight: 1.5, marginBottom: 24 },
  card: { background: '#f0faf5', border: '2px solid #2d8653', borderRadius: 14, padding: '16px 18px', marginBottom: 20, boxShadow: '0 4px 16px rgba(45,134,83,0.12)' },
  cardLabel: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2d8653', marginBottom: 4 },
  price: { fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: '#2d3436', marginBottom: 14 },
  perkRow: { display: 'flex', gap: 8, marginBottom: 8 },
  heart: { fontSize: 13, color: '#2d8653', flexShrink: 0, lineHeight: 1.6 },
  perkText: { fontSize: 12, color: '#4a5568', lineHeight: 1.6 },
  ctaBtn: { display: 'block', width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #2d8653, #1a6e3f)', textAlign: 'center', textDecoration: 'none', border: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  ctaNote: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  faqHead: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'center', marginBottom: 12, marginTop: 24 },
  faqItem: { background: '#fff', border: '1px solid #e5e0d8', borderRadius: 10, padding: '10px 14px', marginBottom: 8 },
  faqQ: { fontSize: 13, fontWeight: 700, color: '#2d3436', marginBottom: 3 },
  faqA: { fontSize: 12, color: '#636e72', lineHeight: 1.5 },
};

export default function EmbedMembership() {
  return (
    <div style={s.wrap}>
      <a href="/embed/service" style={s.back}>← Back to service</a>

      <div style={s.eyebrow}>One Love Membership</div>
      <h1 style={s.h1}>This is how we keep the lights on without selling out.</h1>
      <p style={s.sub}>No ads. No investors. Just riders who think this matters.</p>
      <p style={s.note}>
        One pickup/dropoff can run $15-40 depending on location. The membership is $25/month — free pickups, priority service, seasonal tune-up. Most people join because they want this to exist.
      </p>

      <div style={s.card}>
        <div style={s.cardLabel}>One Love Membership</div>
        <div style={s.price}>$25/month</div>
        {PERKS.map((perk, i) => (
          <div key={i} style={s.perkRow}>
            <span style={s.heart}>♥</span>
            <span style={s.perkText}>{perk}</span>
          </div>
        ))}
      </div>

      {CHECKOUT_URL ? (
        <>
          <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer" style={s.ctaBtn}>
            Join — $25/month
          </a>
          <p style={s.ctaNote}>Billed monthly through Square. Cancel anytime.</p>
        </>
      ) : (
        <a href="/membership" target="_blank" rel="noopener noreferrer" style={s.ctaBtn}>
          Learn about membership →
        </a>
      )}

      <div style={s.faqHead}>Common questions</div>
      {FAQ.map(item => (
        <div key={item.q} style={s.faqItem}>
          <div style={s.faqQ}>{item.q}</div>
          <div style={s.faqA}>{item.a}</div>
        </div>
      ))}
    </div>
  );
}
