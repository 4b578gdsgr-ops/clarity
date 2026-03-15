'use client';

import { useState, useEffect } from 'react';
import CustomBuildForm from '../components/CustomBuildForm';

const WHY_CUSTOM = [
  {
    icon: '🇺🇸',
    title: 'Made in America',
    body: `The big companies flooded the market after COVID. Crashed pricing. Gutted dealer margins. Replaced craftsmanship with gimmicks because gimmicks sell on Instagram. Custom builds are the opposite of all that. Frames from Moots, Seven, Breadwinner, Lynskey — built by small shops, not factories.`,
  },
  {
    icon: '📐',
    title: 'Built for you, not a focus group',
    body: `An American-made titanium frame that will outlive every trend. Components chosen because they're right, not because some brand manager needed to hit a sales target. Off-the-shelf bikes are built for an average body. This one is built for yours.`,
  },
  {
    icon: '♥',
    title: 'Higher karma score',
    body: `Independent frame builders and component makers like Hope, Chris King, and Wolf Tooth score 78–88 on karma vs. 52–55 for big-brand complete bikes. Where your dollar goes matters.`,
  },
  {
    icon: '🏔️',
    title: 'This is what bikes were before they became content',
    body: `Wheels built by hand with your weight, your terrain, your riding style in mind. A well-specced custom build outlasts most complete bikes by a decade or more. Buy once, buy right.`,
  },
  {
    icon: '🤝',
    title: 'The shops send the exotic stuff to us',
    body: `Local shops are our partners, not our competition. We handle the custom work they can't; they handle everything else. When we send you a customer, everyone wins.`,
  },
];

const BUILDERS = [
  { name: 'Moots', location: 'Steamboat Springs, CO', material: 'Titanium · Handmade since 1981', karma: 88 },
  { name: 'Seven Cycles', location: 'Watertown, MA', material: 'Custom titanium and steel · New England built', karma: 85 },
  { name: 'Breadwinner Cycles', location: 'Portland, OR', material: 'Steel and titanium · Two builders, every frame', karma: 82 },
  { name: 'Lynskey Performance', location: 'Chattanooga, TN', material: 'Family-owned titanium since the beginning', karma: 80 },
  { name: 'Chumba USA', location: 'Austin, TX', material: 'Steel / Titanium', karma: 79 },
];

function KarmaBadge({ score }) {
  return (
    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
      style={{ background: '#16a34a15', color: '#16a34a', border: '1px solid #16a34a30' }}>
      ♥ {score}
    </span>
  );
}

export default function CustomBuildsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-10 max-w-2xl mx-auto">

        {/* Hero */}
        <div className={`text-center mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <div className="text-xs font-bold tracking-[3px] uppercase mb-3" style={{ color: '#2d8653' }}>
            One Love Custom Builds
          </div>
          <h1 className="text-3xl font-black mb-3 leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: '#2d3436' }}>
            The industry moved to mass production and quarterly earnings. We moved the other direction.
          </h1>
          <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: '#636e72' }}>
            Every custom bike starts with a conversation. What do you ride? Where do you ride it? What matters to you? We listen first, then we build.
          </p>
          <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>
            One Love Outdoors is a 501(c)(3). Custom builds and memberships fund trail work, community rides, and keeping this tool free forever.
          </p>
        </div>

        {/* Why custom */}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: '#9ca3af' }}>
            Why a custom build?
          </div>
          <div className="flex flex-col gap-3">
            {WHY_CUSTOM.map(item => (
              <div key={item.title} className="flex gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
                <div className="text-2xl shrink-0">{item.icon}</div>
                <div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: '#2d3436' }}>{item.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frame builders */}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: '#9ca3af' }}>
            Builders we work with
          </div>
          <p className="text-xs text-center mb-4" style={{ color: '#636e72' }}>
            {`These aren't brands. They're people. Small shops where the person who designed your frame is the person who built it.`}
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e0d8' }}>
            {BUILDERS.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between px-4 py-3"
                style={{ background: '#ffffff', borderBottom: i < BUILDERS.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#2d3436' }}>{b.name}</div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>{b.location} · {b.material}</div>
                </div>
                <KarmaBadge score={b.karma} />
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-2" style={{ color: '#9ca3af' }}>
            Plus wheel builders at Industry Nine, Chris King, and hand-built by your local shop.
          </p>
        </div>

        {/* The process */}
        <div className="mb-10 px-5 py-5 rounded-xl" style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#2d8653' }}>
            How it works
          </div>
          <div className="flex flex-col gap-3">
            {[
              { step: '01', title: 'Start the conversation', body: 'Fill out the form below. Tell us what you\'re after — or just that you\'re curious.' },
              { step: '02', title: 'We talk', body: 'Nate reaches back within 48 hours. Phone, text, email — whatever works. No sales pitch.' },
              { step: '03', title: 'We spec it together', body: 'Frame, wheels, drivetrain, components. We explain every choice and show you karma scores.' },
              { step: '04', title: 'We build it', body: 'We source from our network of small builders and assemble it to your fit. You pick it up or we ship.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="text-sm font-black font-mono shrink-0 w-6 pt-0.5" style={{ color: '#a3d9b5' }}>{s.step}</div>
                <div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: '#2d3436' }}>{s.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#636e72' }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The form */}
        <div className="px-5 py-6 rounded-2xl mb-8"
          style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 24px rgba(45,134,83,0.07)' }}>
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#2d3436' }}>
              {`Tell us about your dream bike. We'll figure out the rest together.`}
            </h2>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              No commitment. Just a conversation.
            </p>
          </div>
          <CustomBuildForm />
        </div>

        <div className="text-center pb-6">
          <div className="text-[10px]" style={{ color: '#c4bdb5' }}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
        </div>
      </div>
    </div>
  );
}
