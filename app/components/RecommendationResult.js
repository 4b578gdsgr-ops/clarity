'use client';

import { useState } from 'react';
import CustomBuildForm from './CustomBuildForm';

// ─── Funnel tier logic ────────────────────────────────────────────────────────
// Returns: 'custom_lead' | 'custom_soft' | 'custom_mention' | 'local_shop'
function getFunnelTier(profile) {
  if (!profile) return 'local_shop';
  const { budget, bikeType } = profile;
  if (bikeType === 'kids') return 'local_shop';
  if (budget >= 7000) return 'custom_lead';
  if (budget >= 5000) return 'custom_soft';
  if ((bikeType === 'touring') && budget >= 3000) return 'custom_mention';
  return 'local_shop';
}

function getBudgetRange(budget) {
  if (budget < 5000) return '$3,000–$5,000';
  if (budget < 7000) return '$5,000–$7,000';
  if (budget < 10000) return '$7,000–$10,000';
  if (budget < 15000) return '$10,000–$15,000';
  return '$15,000+';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KarmaScore({ score }) {
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      ♥ {score}
    </span>
  );
}

function SpecRow({ label, value, why }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{label}: </span>
          <span className="text-sm font-medium" style={{ color: '#2d3436' }}>{value}</span>
        </div>
        {why && (
          <button onClick={() => setOpen(!open)}
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ background: '#f0faf5', color: '#2d8653', border: '1px solid #d1ead9' }}>
            {open ? 'less' : 'why?'}
          </button>
        )}
      </div>
      {open && why && (
        <p className="mt-1 text-xs leading-relaxed pl-1" style={{ color: '#636e72' }}>{why}</p>
      )}
    </div>
  );
}

function BikeCard({ bike }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{bike.brand}</div>
          <div className="text-base font-bold" style={{ color: '#2d3436' }}>{bike.model}</div>
        </div>
        <KarmaScore score={bike.karma_score} />
      </div>
      <div className="text-xl font-extrabold font-mono mb-2" style={{ color: '#2d8653' }}>
        ${bike.msrp.toLocaleString()}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {[bike.frame_material, bike.suspension_type, bike.wheel_size, bike.drivetrain_type].filter(Boolean).map((tag, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: '#f6fbf8', color: '#4a9e6b', border: '1px solid #d1ead9' }}>
            {tag}
          </span>
        ))}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#636e72' }}>{bike.notes}</p>
      <p className="mt-2 text-xs font-medium" style={{ color: '#2d8653' }}>Ask your local shop about this one →</p>
    </div>
  );
}

// ─── Custom build CTAs by funnel tier ────────────────────────────────────────

// $7k+ — lead with this BEFORE bikes
function CustomLeadBlock({ profile }) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden mb-6"
      style={{ background: 'linear-gradient(135deg, #1a3328, #0d1f15)', border: '1px solid #2d8653' }}>
      <div className="px-5 py-5">
        <div className="text-xs font-bold tracking-[3px] uppercase mb-2" style={{ color: '#4ade80' }}>
          One Love Custom Builds
        </div>
        <div className="text-xl font-black mb-2 leading-snug" style={{ color: '#ffffff', fontFamily: 'Playfair Display, serif' }}>
          At your budget, a custom build is the right call.
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#a3d9b5' }}>
          American-made frames. Components chosen for you, not for a catalog. A bike fitted to your body and your riding — built by craftspeople, not factories.
        </p>

        <div className="flex gap-4 mb-4">
          {[
            { label: 'Typical big-brand complete', score: 52 },
            { label: 'One Love custom build', score: 82 },
          ].map(item => (
            <div key={item.label} className="flex-1 rounded-lg px-3 py-2 text-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="text-xs mb-1" style={{ color: '#a3d9b5' }}>{item.label}</div>
              <div className="text-lg font-black font-mono" style={{ color: item.score >= 70 ? '#4ade80' : '#fbbf24' }}>
                ♥ {item.score}
              </div>
            </div>
          ))}
        </div>

        {!formOpen ? (
          <button onClick={() => setFormOpen(true)}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#4ade80', color: '#0d1f15' }}>
            Design your dream bike with One Love →
          </button>
        ) : (
          <div className="mt-2 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs font-bold mb-3" style={{ color: '#a3d9b5' }}>Start the conversation</div>
            <div className="[&_input]:!bg-[rgba(255,255,255,0.08)] [&_input]:!border-[rgba(255,255,255,0.15)] [&_input]:!text-white [&_input]:placeholder:text-[#6b8f7a] [&_textarea]:!bg-[rgba(255,255,255,0.08)] [&_textarea]:!border-[rgba(255,255,255,0.15)] [&_textarea]:!text-white [&_textarea]:placeholder:text-[#6b8f7a] [&_select]:!bg-[rgba(255,255,255,0.08)] [&_select]:!border-[rgba(255,255,255,0.15)] [&_select]:!text-white [&_label]:!text-[#a3d9b5] [&_p]:!text-[#a3d9b5] [&_button:last-of-type]:!bg-[#4ade80] [&_button:last-of-type]:!text-[#0d1f15]">
              <CustomBuildForm
                prefill={{
                  budget_range: getBudgetRange(profile?.budget),
                  riding_style: profile?.bikeType ? `${profile.bikeType} / ${profile.subtype || 'all-mountain'}` : '',
                  bike_types: [profile?.bikeType].filter(Boolean),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// $5k-$7k — shown after bikes, softer
function CustomSoftBlock({ profile }) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mt-6"
      style={{ background: '#f6fbf8', border: '1px solid #a3d9b5' }}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl shrink-0">🛠️</div>
          <div>
            <div className="text-sm font-bold" style={{ color: '#1a6e3f' }}>Consider a custom build</div>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: '#636e72' }}>
              At your budget, you're in custom territory. American-made frames, components chosen for your riding,
              fitted to your body. Our custom builds score ♥ 82 vs ♥ 55 for typical big-brand complete bikes.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          {[
            'Frame built for your height and reach — not off a size chart',
            'Component brands with higher karma scores: Hope, Chris King, Wolf Tooth',
            'The shops send the exotic spec work to us — local shops stay your go-to for everything else',
          ].map((point, i) => (
            <div key={i} className="flex gap-2 text-xs" style={{ color: '#4a5568' }}>
              <span style={{ color: '#2d8653' }}>♥</span>
              {point}
            </div>
          ))}
        </div>

        {!formOpen ? (
          <button onClick={() => setFormOpen(true)}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #2d8653, #1a6e3f)', color: '#ffffff' }}>
            Talk to One Love about a custom build →
          </button>
        ) : (
          <div className="mt-2">
            <div className="text-xs font-bold mb-3" style={{ color: '#2d8653' }}>Start the conversation</div>
            <CustomBuildForm
              prefill={{
                budget_range: getBudgetRange(profile?.budget),
                riding_style: profile?.bikeType ? `${profile.bikeType} / ${profile.subtype || 'general'}` : '',
                bike_types: [profile?.bikeType].filter(Boolean),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Touring/bikepacking > $3k — lightweight mention
function CustomMentionBlock() {
  return (
    <div className="mt-5 px-4 py-3 rounded-xl flex gap-3"
      style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}>
      <div className="text-xl shrink-0">🗺️</div>
      <div>
        <div className="text-sm font-bold mb-0.5" style={{ color: '#2d8653' }}>Touring riders often go custom</div>
        <p className="text-xs leading-relaxed" style={{ color: '#636e72' }}>
          At your budget, a custom chromoly build from a builder like Breadwinner or Seven gives you a frame dialed to your body and your load. Worth a conversation.
        </p>
        <a href="/custom-builds" className="inline-block mt-2 text-xs font-bold" style={{ color: '#2d8653' }}>
          Learn about custom builds →
        </a>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecommendationResult({ result, profile }) {
  if (!result) return null;

  const funnelTier = getFunnelTier(profile);
  const isCustomLead = funnelTier === 'custom_lead';

  return (
    <div className="mt-8">
      {/* Custom build LEADS for $7k+ */}
      {isCustomLead && <CustomLeadBlock profile={profile} />}

      {/* Recommendation banner */}
      <div className="px-5 py-4 rounded-xl mb-5" style={{ background: 'linear-gradient(135deg, #f0faf5, #e6f4ec)', border: '1px solid #a3d9b5' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2d8653' }}>
          {isCustomLead ? 'Also worth considering — complete bikes' : 'Your recommendation'}
        </div>
        <div className="text-lg font-bold" style={{ color: '#2d3436' }}>{result.headline}</div>
        <div className="text-sm mt-1" style={{ color: '#636e72' }}>{result.summary}</div>
      </div>

      {/* Spec breakdown */}
      <div className="px-4 py-4 rounded-xl mb-5" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Why these specs</div>
        {result.frameMaterial && (
          <SpecRow label="Frame" value={result.frameMaterial} why={result.frameMaterialWhy} />
        )}
        {result.suspensionType && profile?.bikeType === 'mountain' && (
          <SpecRow label="Suspension" value={result.suspensionType} why={result.suspensionWhy} />
        )}
        {result.drivetrainType && (
          <SpecRow label="Drivetrain" value={result.drivetrainType} why={result.drivetrainWhy} />
        )}
        {result.wheelSize && (
          <SpecRow label="Wheel size" value={result.wheelSize} why={result.wheelSizeWhy} />
        )}
      </div>

      {/* Bike suggestions */}
      {result.bikes.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
            {isCustomLead ? 'Complete bike alternatives' : 'Bikes to ask about'}
          </div>
          <div className="flex flex-col gap-3">
            {result.bikes.map(bike => <BikeCard key={bike.id} bike={bike} />)}
          </div>
        </div>
      )}

      {/* Budget-based custom CTAs */}
      {funnelTier === 'custom_soft' && <CustomSoftBlock profile={profile} />}
      {funnelTier === 'custom_mention' && <CustomMentionBlock />}
    </div>
  );
}
