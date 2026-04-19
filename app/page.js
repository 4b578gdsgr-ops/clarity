// ─── Homepage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">

        {/* ── HERO ── */}
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 900, color: '#1a3328', marginBottom: 6, lineHeight: 1.2 }}>
            Let's get you rolling.
          </h1>
          <p style={{ color: '#636e72', fontSize: 15, lineHeight: 1.6 }}>
            Pickup Monday. Back by Friday. We handle the rest.
          </p>
        </div>

        {/* ── BOOK CTA ── */}
        <div className="mb-8">
          <a
            href="/schedule-service"
            style={{
              display: 'block', width: '100%', padding: '16px 0', textAlign: 'center',
              background: 'linear-gradient(135deg, #2d8653, #1a6e3f)',
              color: '#fff', borderRadius: 12, textDecoration: 'none',
              fontSize: 17, fontWeight: 700, boxShadow: '0 2px 16px rgba(45,134,83,0.18)',
            }}
          >
            Book a Pickup
          </a>
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
            Hartford and Tolland county. We confirm within 24 hours.
          </p>
        </div>

        {/* ── THREE CARDS ── */}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#9ca3af' }}>
            More from One Love
          </div>
          <div className="flex flex-col gap-3">
            <a href="/repair-or-replace" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#fde68a'}>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#d97706' }}>Repair or Replace?</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Got a bike collecting dust? Tell us what is wrong. We will tell you if it is worth fixing.
                </div>
              </div>
            </a>

            <a href="/custom-builds" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2d8653'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d1ead9'}>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#2d8653' }}>Custom Builds</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Independent builders. Fitted to your body. Components chosen for quality, not a catalog. Budget $5k and up.
                </div>
              </div>
            </a>

            <a href="https://oneloveoutdoors.org/onelove-members-only" target="_blank" rel="noopener noreferrer" className="flex gap-4 px-4 py-4 rounded-xl no-underline transition-all"
              style={{ background: '#faf9ff', border: '1px solid #e0d9f7' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#9333ea'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d9f7'}>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#9333ea' }}>Membership</div>
                <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
                  Free pickup and dropoff. Priority service. Seasonal tune-up. $25/month.
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ── WHY WE DO THIS ── */}
        <div className="mb-8 px-5 py-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
            Why this exists
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#4a5568' }}>
            We had a bike shop in Connecticut. Community, Saturday mornings, kids getting their first real bike. Then it was gone — not dramatically, just the slow physics of how large money moves through an industry. We watched it happen for years before we had a name for it.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#4a5568' }}>
            One Love Outdoors exists because the outdoor community has always been good at taking care of each other. This is us doing that with whatever tools we have.
          </p>
          <a href="/about" style={{ fontSize: 13, color: '#2d8653', fontWeight: 600, textDecoration: 'none' }}>
            Read the full story
          </a>
        </div>

      </div>
    </div>
  );
}
