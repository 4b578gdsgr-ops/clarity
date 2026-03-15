/**
 * bikeRepairEngine.js
 * Pure function — no imports, no side effects.
 * diagnose(inputs) → result object
 */

// 0 = dept store, 1 = premium/artisan, 2 = quality mainstream, 3 = unknown
const BRAND_TIER = {
  // Premium / artisan — always worth saving
  'Bianchi': 1, 'BMC': 1, 'Cervelo': 1, 'Colnago': 1,
  'Ibis': 1, 'Litespeed': 1, 'Lynskey': 1, 'Moots': 1,
  'Pinarello': 1, 'Pivot': 1, 'Santa Cruz': 1, 'Seven': 1, 'Yeti': 1,
  // Quality mainstream
  'Cannondale': 2, 'Canyon': 2, 'Giant': 2, 'Kona': 2,
  'Marin': 2, 'Norco': 2, 'Orbea': 2, 'Rocky Mountain': 2,
  'Salsa': 2, 'Scott': 2, 'Specialized': 2, 'Surly': 2, 'Trek': 2,
  // Unknown
  "I don't know": 3, 'Other': 3,
  // Department store
  'Department store / big box': 0,
};

// These frames can almost always be repaired even with frame damage
const STEEL_TI = new Set([
  'Moots', 'Seven', 'Litespeed', 'Lynskey', 'Surly', 'Salsa',
]);

// Rough cost note per issue (plain English, warm tone)
const ISSUE_NOTES = {
  shifting:     `Cables, housing, and a proper adjustment: $60–120. One of the highest-impact fixes you can make.`,
  brakes:       `Brake bleed or cable replacement: $50–80. This is a safety item — don't wait on it.`,
  wheels:       `A quality true: $30–50. A hand-built wheel rebuild: $150–250 per wheel. The rebuild is One Love territory.`,
  bb_noise:     `Bottom bracket replacement: $60–150 depending on standard. A creaking pedal stroke means it's time.`,
  headset:      `Headset service or swap: $40–80. Usually a quick win.`,
  suspension:   `Fork service: $150–300. Shock rebuild: $100–200. Neglected suspension is both slower and less safe.`,
  frame_damage: `Frame damage needs professional eyes before you ride. Steel and titanium can often be welded. Carbon is a different conversation.`,
  drivetrain:   `New chain, cassette, and chainring: $100–300 depending on spec. A worn drivetrain makes every other system feel worse.`,
  tuneup:       `A proper tune-up — cables, brakes, bearings, alignment: $80–150. Night-and-day difference on a good frame.`,
  feels_wrong:  `"Feels wrong" is usually something specific. A mechanic finds it in 10 minutes. Book a diagnostic.`,
};

const MAJOR_ISSUES = new Set(['suspension', 'frame_damage', 'drivetrain', 'wheels']);

export function diagnose({ brand, age, issues, riding }) {
  const tier        = BRAND_TIER[brand] ?? 3;
  const isVintage   = age === '10to20' || age === '20plus';
  const isNew       = age === 'under2' || age === '2to5';
  const isMidAge    = age === '5to10';
  const raresRiding = riding === 'rarely';
  const isDeptStore = tier === 0;

  const hasFrameDamage = issues.includes('frame_damage');
  const majorCount     = issues.filter(i => MAJOR_ISSUES.has(i)).length;
  const repairNotes    = issues.map(i => ISSUE_NOTES[i]).filter(Boolean);

  // ── Department store ──────────────────────────────────────────────────────
  if (isDeptStore) {
    return {
      verdict: 'time_for_new',
      color: '#636e72',
      accentBg: '#f5f5f5',
      icon: '🔄',
      headline: `It served you. Now it's done.`,
      subheadline: `Department store bikes weren't built to be repaired.`,
      body: `Big-box bikes are engineered to hit a price point, not to last. Putting real money into one gets you back to the same place in 18 months. Whatever you'd spend on repairs, carry it toward something built to be maintained. You're worth riding a bike that actually works.`,
      repairNotes: [],
      estimatedCost: null,
      ctaVerdict: 'new_bike',
    };
  }

  // ── Frame damage — needs inspection first (carbon / aluminum) ─────────────
  if (hasFrameDamage && !STEEL_TI.has(brand)) {
    return {
      verdict: 'inspect',
      color: '#2563eb',
      accentBg: '#eff6ff',
      icon: '🔍',
      headline: `Don't ride it. Get it looked at first.`,
      subheadline: `Frame damage is a safety question before it's a cost question.`,
      body: `A cracked or damaged frame needs professional assessment before you make any decisions — and definitely before you ride it again. Carbon fiber can fail suddenly and without warning. Aluminum depends on where and how bad. Most shops will look at it for free. If it's repairable, great. If not, you'll know what you're working with.`,
      repairNotes: repairNotes.filter((_, i) => issues[i] !== 'frame_damage'),
      estimatedCost: null,
      ctaVerdict: 'local_shop',
    };
  }

  // ── Frame damage on steel or titanium — almost always fixable ────────────
  if (hasFrameDamage && STEEL_TI.has(brand)) {
    return {
      verdict: 'fix',
      color: '#2d8653',
      accentBg: '#f0faf5',
      icon: '🔧',
      headline: `Steel bends. Steel can be fixed.`,
      subheadline: `A good frame builder can weld this. Don't throw it away.`,
      body: `Steel and titanium were chosen by builders like ${brand} precisely because they're forgiving and repairable. This frame is worth saving. Find a local frame builder or reach out to us for a referral — this kind of repair is exactly what independent builders live for.`,
      repairNotes,
      estimatedCost: `Frame repair: $150–500+ depending on damage and builder.`,
      ctaVerdict: 'fix',
    };
  }

  // ── Vintage quality bike — always restore ─────────────────────────────────
  if (isVintage && tier <= 2) {
    return {
      verdict: 'fix',
      color: '#2d8653',
      accentBg: '#f0faf5',
      icon: '♻️',
      headline: `Vintage bikes are worth it. Full stop.`,
      subheadline: `A ${age === '20plus' ? '20+ year old' : '10–20 year old'} quality frame is genuinely hard to replace.`,
      body: `Old bikes from real brands — steel especially — outlast everything made today. The geometry is often better. The materials hold up. What feels "outdated" usually just needs fresh cables, a new drivetrain, and someone who knows what they're looking at. Restoring this is the right call.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'fix',
    };
  }

  // ── Premium brand, any fixable issue ──────────────────────────────────────
  if (tier === 1) {
    return {
      verdict: 'fix',
      color: '#2d8653',
      accentBg: '#f0faf5',
      icon: '✓',
      headline: `Fix it. This frame has decades left.`,
      subheadline: `You bought well. A ${brand} isn't disposable.`,
      body: `Premium bikes are meant to be maintained, not replaced. Whatever this one needs, the cost makes sense against what the frame is worth — and what it would cost to replace with something equivalent. Build it back up. Ride it for another decade.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'fix',
    };
  }

  // ── Rarely riding + multiple expensive issues ──────────────────────────────
  if (raresRiding && majorCount >= 2) {
    return {
      verdict: 'new_bike',
      color: '#d97706',
      accentBg: '#fffbeb',
      icon: '↗',
      headline: `The math says new bike. Your riding pattern agrees.`,
      subheadline: `When repairs approach replacement value and you're barely riding, a fresh start makes more sense.`,
      body: `The repairs on this one start adding up — and if you're riding rarely, the issue probably isn't just the bike. A different type of bike might actually get you out more. The bike finder can help you answer that honestly. Apply whatever you'd spend on repairs toward something better matched to how you actually want to ride.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'new_bike',
    };
  }

  // ── New quality bike ───────────────────────────────────────────────────────
  if (isNew && tier === 2) {
    return {
      verdict: 'fix',
      color: '#2d8653',
      accentBg: '#f0faf5',
      icon: '✓',
      headline: `Fix it. This bike is young.`,
      subheadline: `A quality bike under 5 years old should have 15 more years in it.`,
      body: `Whatever it needs right now is normal maintenance on a bike in its prime. "Needs work" is not the same as "needs replacing." Get it sorted, keep riding it.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'fix',
    };
  }

  // ── Mid-age quality bike, multiple expensive repairs ──────────────────────
  if ((isMidAge || isVintage) && tier === 2 && majorCount >= 2) {
    return {
      verdict: 'upgrade_path',
      color: '#d97706',
      accentBg: '#fffbeb',
      icon: '→',
      headline: `Fix the critical stuff. Plan the rest.`,
      subheadline: `This bike still has life — but you're at a decision point.`,
      body: `The smart play: handle anything safety-critical now (brakes, suspension, frame issues), let the cosmetic wear ride. Give it another season. If you're still enjoying it, invest in the rest. If you find yourself wanting something different, you'll have gotten another year of riding while thinking it through. Don't make big decisions while standing in the garage.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'upgrade',
    };
  }

  // ── Default: fix it ───────────────────────────────────────────────────────
  return {
    verdict: 'fix',
    color: '#2d8653',
    accentBg: '#f0faf5',
    icon: '✓',
    headline: `Fix it.`,
    subheadline: `This bike is worth the time.`,
    body: `Whatever it needs, the cost makes sense against a quality frame. Fresh cables, a drivetrain refresh, a proper tune — this bike will feel like a different machine. You're worth riding something that works properly.`,
    repairNotes,
    estimatedCost: null,
    ctaVerdict: 'fix',
  };
}
