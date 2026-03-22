/**
 * bikeRepairEngine.js — v2
 * Pure function — no imports, no side effects.
 * diagnose(inputs) → result object
 *
 * Also exports UI data constants so both page versions
 * stay in sync from a single source.
 */

// ─── Brand tiers ──────────────────────────────────────────────────────────────
// 4 = artisan / custom builder (always repair)
// 3 = premium quality (almost always worth repairing)
// 2 = solid mainstream (usually worth repairing)
// 1 = mid-range (conditional — model and age matter)
// 0 = budget / department store (rarely worth major repair)
// -1 = unknown / other

const BRAND_TIER = {
  // ── Artisan / Custom Frame Builders ──────────────────────────────────────
  'Moots': 4, 'Seven': 4, 'Lynskey': 4, 'Litespeed': 4,
  'Breadwinner': 4, 'Chumba': 4, 'Independent Fabrication': 4,
  'Firefly': 4, 'Parlee': 4, 'Alchemy': 4, 'Mosaic': 4,
  'Sage': 4, 'Stinner': 4, 'Sycip': 4, 'Eriksen': 4,
  'Waltly': 4, 'Bearclaw': 4, 'Advocate': 4, 'Argonaut': 4,
  // ── Premium Quality ───────────────────────────────────────────────────────
  'Specialized': 3, 'Trek': 3, 'Santa Cruz': 3, 'Yeti': 3,
  'Pivot': 3, 'Ibis': 3, 'Evil': 3, 'Transition': 3,
  'Juliana': 3, 'Kona': 3, 'Norco': 3, 'Rocky Mountain': 3,
  'Orbea': 3, 'Scott': 3, 'Giant': 3, 'Liv': 3,
  'Cannondale': 3, 'BMC': 3, 'Cervelo': 3, 'Pinarello': 3,
  'Colnago': 3, 'Bianchi': 3, 'Salsa': 3, 'Surly': 3,
  'All-City': 3, 'Marin': 3,
  // ── Solid Mainstream ──────────────────────────────────────────────────────
  'Canyon': 2, 'Diamondback': 2, 'GT': 2, 'Fuji': 2,
  'Jamis': 2, 'Raleigh': 2, 'Felt': 2, 'Niner': 2,
  'Devinci': 2, 'Commencal': 2, 'YT Industries': 2,
  'Polygon': 2, 'Vitus': 2, 'Nukeproof': 2,
  // ── Unknown ───────────────────────────────────────────────────────────────
  "I don't know": -1, 'Other': -1,
  // ── Budget / Department Store ─────────────────────────────────────────────
  'Mongoose': 0, 'Huffy': 0, 'Schwinn (dept store)': 0,
  'Roadmaster': 0, 'Kent': 0, 'Amazon / big box bike': 0,
  'Department store / big box': 0,
};

// Steel/titanium brands — can be welded, last forever
const STEEL_TI_BRANDS = new Set([
  'Moots', 'Seven', 'Litespeed', 'Lynskey', 'Breadwinner', 'Chumba',
  'Sage', 'Stinner', 'Sycip', 'Eriksen', 'Waltly', 'Bearclaw', 'Advocate',
  'Argonaut', 'Independent Fabrication', 'Firefly', 'Mosaic',
  'Surly', 'Salsa', 'All-City',
]);

const CLASSIC_ROAD_BRANDS = new Set([
  'Bianchi', 'Colnago', 'Pinarello', 'Litespeed', 'Lynskey',
  'Moots', 'Seven', 'Cervelo', 'BMC', 'Parlee', 'Argonaut',
]);

// ─── UI data (exported — shared between both form pages) ──────────────────────

export const BRAND_GROUPS = [
  {
    label: 'Artisan / Frame Builders',
    brands: [
      'Alchemy', 'Advocate', 'Argonaut', 'Bearclaw', 'Breadwinner', 'Chumba',
      'Eriksen', 'Firefly', 'Independent Fabrication', 'Litespeed', 'Lynskey',
      'Moots', 'Mosaic', 'Parlee', 'Sage', 'Seven', 'Stinner', 'Sycip', 'Waltly',
    ],
  },
  {
    label: 'Premium MTB',
    brands: ['Evil', 'Ibis', 'Juliana', 'Kona', 'Marin', 'Norco', 'Pivot', 'Rocky Mountain', 'Santa Cruz', 'Transition', 'Yeti'],
  },
  {
    label: 'Road & Endurance',
    brands: ['Bianchi', 'BMC', 'Cervelo', 'Colnago', 'Orbea', 'Pinarello', 'Scott'],
  },
  {
    label: 'Quality All-Round',
    brands: ['All-City', 'Cannondale', 'Canyon', 'Giant', 'Liv', 'Salsa', 'Specialized', 'Surly', 'Trek'],
  },
  {
    label: 'Mid-Range',
    brands: ['Commencal', 'Devinci', 'Diamondback', 'Felt', 'Fuji', 'GT', 'Jamis', 'Niner', 'Nukeproof', 'Polygon', 'Raleigh', 'Vitus', 'YT Industries'],
  },
  {
    label: 'Budget / Big Box',
    brands: ['Amazon / big box bike', 'Department store / big box', 'Huffy', 'Kent', 'Mongoose', 'Roadmaster', 'Schwinn (dept store)'],
  },
  {
    label: 'Other',
    brands: ["I don't know", 'Other'],
  },
];

export const BRANDS_FLAT = [...new Set(BRAND_GROUPS.flatMap(g => g.brands))].sort((a, b) => a.localeCompare(b));

export const AGES = [
  { id: 'under2',  label: 'Less than 2 years' },
  { id: '2to5',   label: '2–5 years' },
  { id: '5to10',  label: '5–10 years' },
  { id: '10to20', label: '10–20 years' },
  { id: '20plus', label: '20+ years / vintage' },
];

export const ISSUES = [
  { id: 'shifting',     label: 'Shifting issues' },
  { id: 'brakes',       label: 'Brake problems' },
  { id: 'wheels',       label: 'Wheels out of true / need rebuild' },
  { id: 'bb_noise',     label: 'Bottom bracket noise or creak' },
  { id: 'headset',      label: 'Headset issues' },
  { id: 'suspension',   label: 'Fork or shock service needed' },
  { id: 'frame_damage', label: 'Frame damage or crack' },
  { id: 'drivetrain',   label: 'Chain / cassette / chainring worn' },
  { id: 'tuneup',       label: 'General tune-up needed' },
  { id: 'feels_wrong',  label: 'It just feels wrong' },
  { id: 'other',        label: "Something else / not sure" },
];

export const RIDING = [
  { id: 'rarely',   label: 'Rarely' },
  { id: 'monthly',  label: 'Few times a month' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'multiple', label: 'Multiple times a week' },
];

export const FRAME_MATERIALS = [
  { id: 'steel',    label: 'Steel / Chromoly' },
  { id: 'titanium', label: 'Titanium' },
  { id: 'aluminum', label: 'Aluminum' },
  { id: 'carbon',   label: 'Carbon fiber' },
  { id: 'ebike',    label: 'E-bike' },
  { id: 'unknown',  label: 'Not sure' },
];

export const SUSP_TYPES = [
  { id: 'full',     label: 'Full suspension' },
  { id: 'hardtail', label: 'Hardtail' },
  { id: 'rigid',    label: 'Rigid / no suspension' },
  { id: 'unknown',  label: 'Not sure' },
];

// ─── Issue cost notes (terse — shown in cost table) ───────────────────────────

const ISSUE_NOTES = {
  shifting:     `Cables, housing, and adjustment: $60–120. One of the highest-impact fixes you can make.`,
  brakes:       `Brake bleed or cable replacement: $50–80 per end. Safety item — don't wait.`,
  wheels:       `Quality true: $30–50. Hand-built wheel rebuild: $150–250 per wheel.`,
  bb_noise:     `Bottom bracket replacement: $60–150 depending on standard. Creaking pedal stroke = time to replace.`,
  headset:      `Headset service or swap: $40–80. Usually a quick win.`,
  suspension:   `Fork service: $150–300. Shock rebuild: $100–200. We do this in-house.`,
  frame_damage: `Frame damage needs professional eyes before you ride. Steel and titanium can often be welded.`,
  drivetrain:   `Chain, cassette, chainring: $100–300 depending on spec. Worn drivetrain makes everything else worse.`,
  tuneup:       `Full tune-up — cables, brakes, bearings, alignment: $80–150. Night-and-day on a good frame.`,
  feels_wrong:  `"Feels wrong" is usually something specific. A mechanic finds it in 10 minutes.`,
};

const MAJOR_ISSUES = new Set(['suspension', 'frame_damage', 'drivetrain', 'wheels']);

// ─── Section builders (conversational narrative blocks) ───────────────────────

function buildFrameSection(brand, age, frameMaterial, suspType, tier) {
  const isYoung   = age === 'under2' || age === '2to5';
  const isMidAge  = age === '5to10';
  const isOld     = age === '10to20' || age === '20plus';
  const isVintage = age === '20plus';

  if (frameMaterial === 'titanium') {
    return `Titanium frames are lifetime frames. This one isn't going anywhere. Titanium doesn't fatigue, doesn't corrode, and will outlast every component on it. Whatever else needs work, the frame is not the concern.`;
  }

  if (frameMaterial === 'steel') {
    if (isYoung)  return `Steel is one of the best materials for long-term ownership. Modern chromoly is light, stiff where it needs to be, and compliant where it counts. This frame has decades in it.`;
    if (isMidAge) return `At this age, a steel frame is in its stride. No corrosion issues if it's been maintained, no fatigue, no proprietary anything. Steel hardtails and road bikes age gracefully — the ride quality doesn't change.`;
    if (isOld)    return `Older steel bikes have a loyal following for a reason — the ride quality holds up in a way aluminum and carbon can't match. If the frame is clean and straight, it's worth the work.`;
  }

  if (frameMaterial === 'carbon') {
    if (isYoung)  return `Carbon from this era is the right material — light, stiff, comfortable. No frame concerns at this age. Focus on the components.`;
    if (isMidAge) {
      if (tier >= 3) return `A quality carbon frame from this era is still a strong platform. High-end carbon ages well if it hasn't been crashed. Worth investing in.`;
      return `Carbon quality varies a lot by price point and year. If the frame hasn't been crashed, it's probably fine — but worth a visual check before committing to major component work.`;
    }
    if (isOld)    return `Older carbon needs scrutiny before investing. Check for delamination, micro-cracks around the head tube and bottom bracket, and any impact damage. Get it inspected first — most shops do this for free.`;
  }

  if (frameMaterial === 'aluminum') {
    if (isYoung)  return `Aluminum frames from quality brands are solid and fully serviceable. Frame isn't the issue here.`;
    if (isMidAge) {
      if (tier >= 3) return `Quality aluminum in this age range is still a solid platform. Aluminum can't be welded if cracked, but if it's structurally sound — and it sounds like it is — every component is standard and replaceable.`;
      return `Mid-age aluminum: worth a quick visual check for cracks around the welds and bottom bracket. If it looks clean, it's a workable platform.`;
    }
    if (isOld)    return `Older aluminum: structurally still rideable if the frame is sound, but the geometry has likely dated out. Components are all standard. Worth checking whether the fit and feel still works for you before investing.`;
  }

  if (frameMaterial === 'ebike') {
    return `E-bike repairs split into two categories: motor/battery, and everything else. Everything else — brakes, drivetrain, wheels — we handle just like any bike. Motor and battery issues depend on the brand and warranty status.`;
  }

  // Infer from brand if material not specified
  if (STEEL_TI_BRANDS.has(brand)) {
    return `${brand} builds on steel or titanium — both built for the long haul. This frame is not the weak point. Repair, maintain, and ride it.`;
  }

  if (tier === 4) return `Custom frames from builders like ${brand} are made to be owned for decades. Whatever it needs, the investment makes sense against the frame value.`;
  if (tier >= 3 && isYoung)  return `A young ${brand} is a well-built machine with a lot of life ahead. Frame isn't the concern here.`;
  if (tier >= 3 && isMidAge) return `${brand} builds quality bikes. At this age the frame is a solid platform — relatively modern geometry and build quality that holds up.`;
  if (tier >= 3 && isOld)    return `Older ${brand} bikes from the premium lines hold their ride quality well. The question is whether the geometry still fits the way you want to ride.`;
  if (tier === 2 && !isOld)  return `Decent platform. Components are all standard. If the frame is sound, the work makes sense.`;
  return `Frame assessment: we'd want to see it before committing to a full scope. Bring it in or book a pickup — diagnosis is free.`;
}

function buildFullSuspSection(age) {
  const isUnder7  = age === 'under2' || age === '2to5';
  const isMid7to10 = age === '5to10';
  const isOver10  = age === '10to20' || age === '20plus';

  if (isUnder7) {
    return `Under 7 years old, a full suspension bike is in good shape from a parts standpoint. Pivot bearings, linkage hardware, and shock mounts are all still being manufactured and stocked. Service the shock, grease the pivots, and this bike has another 5+ years in it.`;
  }
  if (isMid7to10) {
    return `Here's the honest conversation: replacement parts for full suspension bikes start getting hard to find around this age. Pivot bearings, linkage hardware, and shock mounts are often brand-specific and go out of production. We can usually make it work — and we'll try — but it's worth factoring in that sourcing sometimes costs more in time than the parts themselves. Let's diagnose the full scope before committing.`;
  }
  if (isOver10) {
    return `Full suspension bikes over 10 years old are tough. Parts availability gets unreliable — pivot bearings, linkage hardware, and proprietary shock mounts often go out of production around this window. The geometry is also significantly outdated: head angles are steeper, reach is shorter, and the suspension design has been through multiple generations of improvement since then. Unless there's real sentimental value, or this was a genuinely high-end bike from a brand with exceptional parts support, this might be the moment.`;
  }
  return null;
}

function buildDrivetrainSection(issues, age) {
  const has = (id) => issues.includes(id);
  if (!has('shifting') && !has('drivetrain') && !has('bb_noise')) return null;

  const parts = [
    has('shifting')  && 'shifting',
    has('drivetrain') && 'worn drivetrain',
    has('bb_noise')  && 'bottom bracket noise',
  ].filter(Boolean);

  const isNew   = age === 'under2' || age === '2to5';
  const isOld   = age === '10to20' || age === '20plus';
  const genNote = age === 'under2' || age === '2to5'
    ? '11- or 12-speed'
    : age === '5to10' ? '10- or 11-speed'
    : age === '10to20' ? '8- or 9-speed'
    : '7- or 8-speed';

  if (isNew) {
    return `${parts.join(' and ')} on a newer bike is normal wear. This is a ${genNote} drivetrain — fully supported, parts are everywhere. A fresh chain and cassette every 1,500–2,000 miles is just maintenance. Budget $80–250 depending on spec. Fix it and reset the clock.`;
  }
  if (age === '20plus') {
    return `Older 7- and 8-speed drivetrains are actually cheap and widely available. Shimano still makes everything you need. $50–100 gets you most of it. This isn't the expensive part of the repair.`;
  }
  return `${parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')} — this is probably a ${genNote} drivetrain. Fully serviceable. Budget $80–250 depending on what needs replacing.`;
}

function buildBrakeSection(issues) {
  if (!issues.includes('brakes')) return null;
  return `Brakes are a safety item and a quick win. Hydraulic bleed: $50–80 per end. Brake pad replacement: $30–50 per wheel. Cable brakes are cheaper. This is the first thing we'd address — before anything else.`;
}

function buildWheelSection(issues) {
  if (!issues.includes('wheels')) return null;
  return `Wheel truing: $30–50 and takes about 20 minutes. If the wheels are genuinely shot — cracked rim, blown nipples, loose spokes throughout — a hand-built rebuild runs $150–250 per wheel and gives you a wheel that will outlast the next three sets of tires. Worth finding a local shop that does this in-house.`;
}

function buildSuspServiceSection(issues, suspType, age) {
  if (!issues.includes('suspension')) return null;
  const isOld = age === '10to20' || age === '20plus';
  if (isOld) {
    return `Suspension service on older bikes: fork service $150–300, shock rebuild $100–200. The question isn't whether we can do it — it's whether service parts exist for your specific model. Pre-2015 forks and shocks often have cartridge kits that are out of production. We'll check parts availability before committing to scope.`;
  }
  return `Fork service: $150–300 depending on travel and internals. Shock rebuild or tune: $100–200. We do suspension work in-house — air spring service, damper rebuilds, and setup for your weight and riding style. Most shops send this out. We don't.`;
}

function buildEbikeSection(frameMaterial, issues) {
  if (frameMaterial !== 'ebike') return null;
  const hasMotorIssue = issues.includes('feels_wrong') || issues.includes('other');
  if (hasMotorIssue) {
    return `Motor and battery issues: check your warranty first — most quality e-bike systems have 2-year coverage. Bosch and Shimano EP8 systems require authorized dealer service for motor work. Generic hub-motor bikes from Amazon are a different story — motor repair often isn't economical. For everything else on the bike (brakes, drivetrain, wheels), we handle it exactly like any other bike.`;
  }
  return `Everything mechanical on your e-bike — brakes, drivetrain, wheels, headset — is standard bicycle work and absolutely worth doing. Motor and battery are a separate category: check warranty status, and if out of warranty, it depends on the motor brand.`;
}

function assembleSections(frameBody, fullSuspBody, dtBody, brakeBody, wheelBody, suspServBody, ebikeBody, takeBody) {
  const sections = [];
  if (frameBody)    sections.push({ title: 'The frame', body: frameBody });
  if (ebikeBody)    sections.push({ title: 'Motor and battery', body: ebikeBody });
  if (fullSuspBody) sections.push({ title: 'The suspension platform', body: fullSuspBody });
  if (dtBody)       sections.push({ title: 'The drivetrain', body: dtBody });
  if (brakeBody)    sections.push({ title: 'The brakes', body: brakeBody });
  if (wheelBody)    sections.push({ title: 'The wheels', body: wheelBody });
  if (suspServBody) sections.push({ title: 'Suspension service', body: suspServBody });
  if (takeBody)     sections.push({ title: 'Our take', body: takeBody });
  return sections;
}

// ─── Main diagnose() ──────────────────────────────────────────────────────────

export function diagnose({ brand, age, issues, riding, frameMaterial = 'unknown', suspType = 'unknown' }) {
  const tier      = BRAND_TIER[brand] ?? -1;
  const isArtisan = tier === 4;
  const isBudget  = tier === 0;

  const isVintage  = age === '10to20' || age === '20plus';
  const is20plus   = age === '20plus';
  const isMidAge   = age === '5to10';
  const isNew      = age === 'under2' || age === '2to5';
  const raresRiding = riding === 'rarely';

  const isFullSusp = suspType === 'full';
  const isHardtailOrRigid = suspType === 'hardtail' || suspType === 'rigid';

  const isSteelOrTi = frameMaterial === 'steel' || frameMaterial === 'titanium' ||
                      (frameMaterial === 'unknown' && STEEL_TI_BRANDS.has(brand));
  const isEbike  = frameMaterial === 'ebike';
  const isCarbon = frameMaterial === 'carbon';

  const hasFrameDamage = issues.includes('frame_damage');
  const majorCount     = issues.filter(i => MAJOR_ISSUES.has(i)).length;
  const repairNotes    = issues.filter(i => i !== 'other').map(i => ISSUE_NOTES[i]).filter(Boolean);

  // Build section components
  const frameBody    = buildFrameSection(brand, age, frameMaterial, suspType, tier);
  const fullSuspBody = isFullSusp ? buildFullSuspSection(age) : null;
  const dtBody       = buildDrivetrainSection(issues, age);
  const brakeBody    = buildBrakeSection(issues);
  const wheelBody    = buildWheelSection(issues);
  const suspServBody = buildSuspServiceSection(issues, suspType, age);
  const ebikeBody    = buildEbikeSection(frameMaterial, issues);

  function s(takeBody) {
    return assembleSections(frameBody, fullSuspBody, dtBody, brakeBody, wheelBody, suspServBody, ebikeBody, takeBody);
  }

  // ── "Other" issue — can't diagnose remotely ───────────────────────────────
  if (issues.includes('other')) {
    return {
      verdict: 'unknown', color: '#5a5750', accentBg: '#f5f2ec', icon: '?',
      headline: `Hard to say without seeing it.`,
      subheadline: `Some things can't be diagnosed from a form.`,
      body: `We'll give you an honest assessment — no charge for the diagnosis. If it's worth fixing, we'll tell you exactly what it needs and what it'll cost. If it's not, we'll tell you that too.`,
      sections: s(`Book a pickup and we'll do a full assessment before touching anything. No obligation.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Department store / budget bike ────────────────────────────────────────
  if (isBudget) {
    return {
      verdict: 'time_for_new', color: '#636e72', accentBg: '#f5f5f5', icon: '↻',
      headline: `It served you. Now it's done.`,
      subheadline: `Built to be sold. Not repaired.`,
      body: `Department store bikes are built to hit a price point, not to be maintained. Putting $200 into repairs makes the repair worth more than the bike. You deserve better — and it doesn't have to cost a fortune.`,
      sections: s(`Let's find you something worth owning. A quality used bike from a local shop beats a new big-box bike at the same price every time.`),
      repairNotes: [], estimatedCost: null, ctaVerdict: 'new_bike',
    };
  }

  // ── Frame damage on carbon / aluminum — get it inspected ─────────────────
  if (hasFrameDamage && !isSteelOrTi && !isEbike) {
    return {
      verdict: 'inspect', color: '#2563eb', accentBg: '#eff6ff', icon: '!',
      headline: `Don't ride it. Get it inspected first.`,
      subheadline: `Frame damage is a safety question before it's a cost question.`,
      body: isCarbon
        ? `Carbon fiber can fail suddenly and without warning. A crack or impact site that looks minor can compromise the whole structure. Get eyes on it before any other decisions — most shops do this for free. Professional carbon repair runs $200–500 and is worth it on a quality frame. Entry-level carbon is a different calculation.`
        : `A cracked or dented aluminum frame needs assessment before you decide anything. Some aluminum can be worked around; some can't. Get a professional look first — and don't ride it until then.`,
      sections: s(`Once we know what we're working with on the frame, everything else is normal repair work.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'local_shop',
    };
  }

  // ── Frame damage on steel / titanium — weld it ───────────────────────────
  if (hasFrameDamage && isSteelOrTi) {
    return {
      verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
      headline: `Steel bends. Steel can be fixed.`,
      subheadline: `A good frame builder can weld this. Don't throw it away.`,
      body: `Steel and titanium were chosen by builders precisely because they're repairable. A good frame builder can address most weld cracks, dents, and damage. This is exactly what independent builders live for. Reach out and we'll give you a referral.`,
      sections: s(`Frame repair: $150–500+ depending on damage and builder. Always worth it on quality steel and titanium.`),
      repairNotes, estimatedCost: `Frame repair: $150–500+ depending on damage.`, ctaVerdict: 'fix',
    };
  }

  // ── E-bike with motor / battery concerns ─────────────────────────────────
  if (isEbike && (issues.includes('feels_wrong') || issues.includes('other'))) {
    return {
      verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
      headline: `Most of this is standard bike work.`,
      subheadline: `Motor and battery issues are separate from everything else on an e-bike.`,
      body: `Everything mechanical we can handle. For the motor/battery side, check your warranty first — most quality systems have 2-year coverage and Bosch/Shimano require authorized service for motor work. A hub-motor Amazon e-bike is a different story.`,
      sections: s(`Book a pickup and let's separate what's a bike problem from what's a motor problem.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Artisan / custom frame ────────────────────────────────────────────────
  if (isArtisan) {
    return {
      verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
      headline: `Fix it. Custom frames don't quit.`,
      subheadline: `You paid for a lifetime bike. This is the lifetime part.`,
      body: `Builders like ${brand} make frames meant to be owned for decades. The components around it may come and go — that's normal. The frame is the investment. Maintain what's around it and keep riding.`,
      sections: s(`Every dollar you put into this bike makes sense against what the frame is worth. Let's figure out what it needs.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Full suspension + 10+ years old ──────────────────────────────────────
  if (isFullSusp && isVintage) {
    const isHighEnd = tier >= 3;
    return {
      verdict: isHighEnd ? 'upgrade_path' : 'new_bike',
      color: isHighEnd ? '#d97706' : '#636e72',
      accentBg: isHighEnd ? '#fffbeb' : '#f5f5f5',
      icon: isHighEnd ? '→' : '↻',
      headline: isHighEnd
        ? `This is a conversation, not a simple yes.`
        : `Full suspension bikes over 10 years old are tough.`,
      subheadline: isHighEnd
        ? `High-end full suspension bikes can be saved — but with eyes open.`
        : `The parts that keep it working get harder and harder to source.`,
      body: `Here's the reality: the frame might be fine, but pivot bearings, linkage hardware, and shock mounts are often brand-specific and go out of production around this age. The geometry has also moved significantly — head angles, reach, suspension design, wheel size. We'll always try. But at a certain point the search for a discontinued pivot bearing costs more in time than a newer bike costs in money.`,
      sections: s(isHighEnd
        ? `If you love this bike and want to make it work, let's talk through the scope. If you're open to moving on, we can help you find what's next.`
        : `Unless there's sentimental value here, this might be the moment. We can help you find a newer platform.`),
      repairNotes, estimatedCost: null, ctaVerdict: isHighEnd ? 'upgrade' : 'new_bike',
    };
  }

  // ── Full suspension + 5–10 years old ─────────────────────────────────────
  if (isFullSusp && isMidAge) {
    return {
      verdict: 'fix', color: '#d97706', accentBg: '#fffbeb', icon: '→',
      headline: `Worth fixing — with a realistic conversation first.`,
      subheadline: `Full suspension bikes in this age range need the right assessment.`,
      body: `The mechanical work is mostly straightforward. The honest part: pivot bearings and suspension hardware for bikes from this era are starting to become harder to source. We're not saying don't fix it — we're saying let's scope it properly before committing.`,
      sections: s(`Book a pickup and we'll do a full assessment before touching anything. We'll tell you exactly what we find and what the real number is.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Hardtail / rigid on steel or titanium, vintage ───────────────────────
  // Steel/ti hardtails age much better than full suspension — no pivots, no proprietary parts
  if (isHardtailOrRigid && isSteelOrTi && isVintage) {
    return {
      verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
      headline: `Classic steel. Fix it.`,
      subheadline: `Steel hardtails and rigid bikes don't age the way full suspension does. They age better.`,
      body: `No pivots to wear out. No proprietary linkage hardware. No obsolete bearing kits. A 15-year-old steel hardtail with good geometry is still a great bike. The components are all standard and replaceable. The frame will outlast everything else on it.`,
      sections: s(`This is exactly what we love working on. Fresh cables, drivetrain refresh, and this bike rides like new. Let's do it.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Rarely riding + multiple major issues ─────────────────────────────────
  if (raresRiding && majorCount >= 2) {
    return {
      verdict: 'new_bike', color: '#d97706', accentBg: '#fffbeb', icon: '↗',
      headline: `The repairs don't pencil out.`,
      subheadline: `You're not riding it much. And it needs a lot.`,
      body: `It's not that it can't be fixed — it can. It's that the math doesn't work when you're not riding regularly. The repairs will cost more than finding something that actually gets you excited to be on a bike. Let's figure out what you actually want to ride.`,
      sections: s(`Tell us what riding you'd like to be doing. We'll point you toward what makes sense.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'new_bike',
    };
  }

  // ── Classic road geometry, vintage ───────────────────────────────────────
  if (isVintage && tier >= 2 && CLASSIC_ROAD_BRANDS.has(brand)) {
    return {
      verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
      headline: `Classic steel road bikes have a following for a reason.`,
      subheadline: `${brand} from this era is legitimate kit — just know what you're working with.`,
      body: `Classic road geometry is aggressive by modern standards — steep head angles, long reach, low stack. Great for riders who love that feel. Not always great for anyone dealing with back, neck, or hand issues. The bike is worth restoring. Whether the geometry still works for the way you ride now is worth figuring out first.`,
      sections: s(`Come in and let's ride it. We'll tell you if it fits the way you want to ride before you put money into it.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Old mountain bike — geometry conversation is real ────────────────────
  if (isVintage && tier >= 2) {
    const is26era = is20plus; // pre-2004 = almost certainly 26" wheel era
    return {
      verdict: 'upgrade_path', color: '#d97706', accentBg: '#fffbeb', icon: '→',
      headline: is26era
        ? `Mountain bike geometry has moved a long way from here.`
        : `This frame has life. But the geometry conversation is real.`,
      subheadline: is26era
        ? `26" wheels, steep head angles, short reach — the trail has changed.`
        : `10–15 year old mountain bikes are at a crossroads.`,
      body: is26era
        ? `Pre-2012 mountain bikes — 26" hardtails and early 29ers — were designed before the geometry revolution. Shorter reach, steeper head angles, much less capability than modern bikes. The bike is mechanically fixable, but the gap between it and a modern bike is enormous. Consider putting that repair money toward a new platform instead.`
        : `Bikes from this era can still be great, depending on the geometry and how it fits your riding. Mechanically everything is fixable. The question is whether you want to invest in a frame from this era or use the opportunity to step into something newer.`,
      sections: s(is26era
        ? `Let's find you something with modern geometry. The difference in how it rides is hard to overstate.`
        : `If you want to keep it, we'll make it ride well. If you're considering moving on, let's talk about what you'd get for the same money.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'upgrade',
    };
  }

  // ── Premium brand, new or mid-age, minor issues ───────────────────────────
  if (tier >= 3 && (isNew || isMidAge) && majorCount <= 1) {
    return {
      verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
      headline: `Fix it. This bike is in its prime.`,
      subheadline: `A quality ${brand} in this age range should have 10+ years left in it.`,
      body: `Whatever's wrong is normal maintenance on a bike that has plenty of life ahead. A good mechanic gets this right in an afternoon.`,
      sections: s(`Total estimate for what you've described: $80–300 depending on what we find. Fix it and reset the maintenance clock.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'fix',
    };
  }

  // ── Quality bike with multiple expensive issues ───────────────────────────
  if (tier >= 2 && majorCount >= 2) {
    return {
      verdict: 'upgrade_path', color: '#d97706', accentBg: '#fffbeb', icon: '→',
      headline: `Fix the critical stuff. Plan the rest.`,
      subheadline: `This bike has life — but you're at a decision point.`,
      body: `The frame is worth keeping. Handle anything safety-critical now — brakes, anything affecting control. Cosmetic wear can ride. Give it another season and then decide about a component upgrade rather than piecemeal fixes.`,
      sections: s(`We'll prioritize what matters. Safety items first, then a plan for the rest.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'upgrade',
    };
  }

  // ── Mid-range + multiple major issues, not new ───────────────────────────
  if (tier <= 1 && majorCount >= 2 && !isNew) {
    return {
      verdict: 'upgrade_path', color: '#d97706', accentBg: '#fffbeb', icon: '→',
      headline: `The math is getting tight.`,
      subheadline: `Repairs are possible, but worth comparing to what that money buys you new.`,
      body: `A mid-range bike with multiple major issues is at a crossroads. The repairs are doable, but the cost starts closing in on what a quality used bike costs. Let's get a real number before deciding.`,
      sections: s(`Come in for a diagnosis. We'll give you a real number and an honest comparison.`),
      repairNotes, estimatedCost: null, ctaVerdict: 'upgrade',
    };
  }

  // ── Default: fix it ───────────────────────────────────────────────────────
  return {
    verdict: 'fix', color: '#2d8653', accentBg: '#f0faf5', icon: '✓',
    headline: `Fix it.`,
    subheadline: `This bike is worth the time.`,
    body: `This bike has life in it. Whatever it needs right now is normal maintenance on a solid platform.`,
    sections: s(`Total estimate for what you've described: $80–300 depending on what we find. Fresh cables, a drivetrain refresh, a proper tune — it'll feel like a different machine.`),
    repairNotes, estimatedCost: null, ctaVerdict: 'fix',
  };
}
