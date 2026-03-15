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
  wheels:       `A quality true: $30–50. A hand-built wheel rebuild: $150–250 per wheel. Ask your local shop, or reach out if it's a complex build.`,
  bb_noise:     `Bottom bracket replacement: $60–150 depending on standard. A creaking pedal stroke means it's time.`,
  headset:      `Headset service or swap: $40–80. Usually a quick win.`,
  suspension:   `Fork service: $150–300. Shock rebuild: $100–200. We do full suspension service in-house — rebuilds, re-valving, and setup for your weight and riding style. Most shops send this out. We don't.`,
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
      subheadline: `Built to be sold. Not repaired.`,
      body: `Here's the truth: this bike was built to be sold, not ridden. Putting $200 into repairs doesn't make sense when the frame can't hold up its end. You deserve better, and it doesn't have to cost a fortune.`,
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
      body: `This bike has life in it. Old bikes from real brands outlast everything made today — the geometry is often better, the materials hold up. A good tune-up and it'll ride like you remember. Here's what we'd do.`,
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
      body: `This bike has life in it. Premium bikes are meant to be maintained, not replaced. A good tune-up and it'll ride like you remember. The cost makes sense against what the frame is worth. Here's what we'd do.`,
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
      headline: `The repairs don't pencil out.`,
      subheadline: `You're not riding it. And it needs a lot. Time for something new.`,
      body: `It served you well. But you're worth riding something that actually works. Let's find what's next. And if that old bike still has some life in it, we'll help you pass it on to someone who needs it.`,
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
      body: `This bike has life in it. A good tune-up and it'll ride like you remember. Whatever it needs right now is normal maintenance on a bike in its prime. Here's what we'd do.`,
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
      body: `The frame is worth keeping. Let's put some better parts on it and get you another few years. Think of it as a second chance. Handle anything safety-critical now — brakes, suspension, frame issues. Let the cosmetic wear ride. Give it another season.`,
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
    body: `This bike has life in it. A good tune-up and it'll ride like you remember. Fresh cables, a drivetrain refresh, a proper tune — this bike will feel like a different machine. Here's what we'd do.`,
    repairNotes,
    estimatedCost: null,
    ctaVerdict: 'fix',
  };
}
