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

// Classic steel/Ti road geometry — beautiful to ride but can be aggressive by modern standards
const CLASSIC_ROAD = new Set([
  'Bianchi', 'Colnago', 'Pinarello', 'Litespeed', 'Lynskey', 'Moots', 'Seven',
]);

// Brands heavily associated with MTB — geometry has evolved dramatically
const MTB_BRANDS = new Set([
  'Santa Cruz', 'Yeti', 'Ibis', 'Pivot', 'Kona', 'Marin', 'Rocky Mountain', 'Norco',
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
  const is10to20    = age === '10to20';
  const is20plus    = age === '20plus';
  const isVintage   = is10to20 || is20plus;
  const isNew       = age === 'under2' || age === '2to5';
  const isMidAge    = age === '5to10';
  const raresRiding = riding === 'rarely';
  const isDeptStore = tier === 0;
  const isClassicRoad = CLASSIC_ROAD.has(brand);
  const isMTB        = MTB_BRANDS.has(brand) || issues.includes('suspension');

  const hasFrameDamage = issues.includes('frame_damage');
  const hasOtherIssue  = issues.includes('other');
  const majorCount     = issues.filter(i => MAJOR_ISSUES.has(i)).length;
  const repairNotes    = issues.filter(i => i !== 'other').map(i => ISSUE_NOTES[i]).filter(Boolean);

  // ── "Other" issue selected — can't diagnose remotely ─────────────────────
  if (hasOtherIssue) {
    return {
      verdict: 'unknown',
      color: '#5a5750',
      accentBg: '#f5f2ec',
      icon: '?',
      headline: `Hard to say without seeing it.`,
      subheadline: `Some things can't be diagnosed from a form.`,
      body: `We'll give you an honest assessment — no charge for the diagnosis. If it's worth fixing, we'll tell you exactly what it needs and what it'll cost. If it's not, we'll tell you that too.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'fix',
    };
  }

  // ── Department store ──────────────────────────────────────────────────────
  if (isDeptStore) {
    return {
      verdict: 'time_for_new',
      color: '#636e72',
      accentBg: '#f5f5f5',
      icon: '↻',
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
      icon: '!',
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
      icon: '✓',
      headline: `Steel bends. Steel can be fixed.`,
      subheadline: `A good frame builder can weld this. Don't throw it away.`,
      body: `Steel and titanium were chosen by builders like ${brand} precisely because they're forgiving and repairable. This frame is worth saving. Find a local frame builder or reach out to us for a referral — this kind of repair is exactly what independent builders live for.`,
      repairNotes,
      estimatedCost: `Frame repair: $150–500+ depending on damage and builder.`,
      ctaVerdict: 'fix',
    };
  }

  // ── 10–20 year old quality bike ───────────────────────────────────────────
  if (is10to20 && tier <= 2) {
    return {
      verdict: 'fix',
      color: '#2d8653',
      accentBg: '#f0faf5',
      icon: '✓',
      headline: `Can we fix it? Yes. Should we? Let's talk.`,
      subheadline: `A 10–20 year old quality frame can have plenty of life left — but geometry has changed.`,
      body: `Older frames can be mechanically sound, but geometry has changed a lot in the last decade. If your back, neck, or hands hurt on rides, it might not be the fit — it might be the frame. Worth a conversation before you put money into it.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'fix',
    };
  }

  // ── 20+ year old bike — be honest about what age means ───────────────────
  if (is20plus && tier <= 2) {
    if (isClassicRoad) {
      return {
        verdict: 'fix',
        color: '#2d8653',
        accentBg: '#f0faf5',
        icon: '✓',
        headline: `Classic steel rides beautifully. But let's be honest about it.`,
        subheadline: `A ${brand} from this era is a legitimate piece of kit — just know what you're working with.`,
        body: `Classic steel geometry is aggressive by modern standards — steep head angles, long reach, low stack. Great for collectors and riders who love the feel. Not always great for daily riding or anyone who's dealt with back, neck, or hand pain. Mechanically? Absolutely worth restoring. But come in and let's ride it first.`,
        repairNotes,
        estimatedCost: null,
        ctaVerdict: 'fix',
      };
    }

    if (isMTB) {
      return {
        verdict: 'upgrade_path',
        color: '#d97706',
        accentBg: '#fffbeb',
        icon: '→',
        headline: `Mountain bike geometry has moved on. So should you.`,
        subheadline: `Older MTB frames may be holding you back more than you realize.`,
        body: `Pre-2015 mountain bikes — especially 26" hardtails and early 29ers — have shorter reach, steeper head angles, and less capability than modern frames. The bike might be mechanically fixable, but you'd be putting parts on a geometry that was designed before the trail got good. Let's talk about what's next.`,
        repairNotes,
        estimatedCost: null,
        ctaVerdict: 'upgrade',
      };
    }

    return {
      verdict: 'upgrade_path',
      color: '#d97706',
      accentBg: '#fffbeb',
      icon: '→',
      headline: `Can we fix it? Probably. Should we? That's the real question.`,
      subheadline: `At 20+ years, it's not just about whether it's fixable.`,
      body: `Even if it's mechanically sound, the ride quality and geometry of a 20+ year old bike may not be worth the investment. Modern bikes are more comfortable, safer, and more capable. We're not trying to sell you something — but we'd rather have an honest conversation than take your money on repairs that don't make you happy on the road.`,
      repairNotes,
      estimatedCost: null,
      ctaVerdict: 'upgrade',
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
