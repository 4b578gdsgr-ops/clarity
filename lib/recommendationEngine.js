import { SEED_BIKES } from './seedBikes';

// Custom build components for high-budget riders
const CUSTOM_BUILD_OPTIONS = {
  frames: [
    // We don't name specific builders here — the list changes as we find builders worth believing in.
    // Independent frame builders: titanium, steel, and carbon. Not publicly traded. Not PE-owned.
    // Ask us who we're working with right now.
  ],
  wheels: [
    { name: 'Industry Nine', country: 'USA (Asheville, NC)', karma_score: 84, notes: 'Hand-built in NC. Employee-owned. 6-year warranty.' },
    { name: 'Chris King', country: 'USA (Portland, OR)', karma_score: 86, notes: 'Made in Portland. 5-year warranty. Legendary quality.' },
    { name: "Stan's NoTubes", country: 'USA (Victor, NY)', karma_score: 70, notes: 'Great value hand-built option. Ask your local shop.' },
  ],
  components: [
    { name: 'Hope Technology', country: 'UK (Barnoldswick)', karma_score: 88, notes: 'Employee-owned UK manufacturer. All machined in-house.' },
    { name: 'Wolf Tooth Components', country: 'USA (Minneapolis, MN)', karma_score: 82, notes: 'Small MN company. Precision-machined. Excellent support.' },
    { name: 'Chris King', country: 'USA (Portland, OR)', karma_score: 86, notes: 'Headsets, hubs, bottom brackets. Made to last a lifetime.' },
    { name: 'Cane Creek', country: 'USA (Fletcher, NC)', karma_score: 75, notes: 'NC-made headsets and suspension components.' },
  ],
};

/**
 * recommend(profile) → result
 *
 * profile = {
 *   bikeType: 'mountain'|'road'|'gravel'|'touring'|'commuter'|'ebike'|'kids'|'unsure',
 *   subtype: 'trail'|'enduro'|'xc'|'downhill'|null,
 *   ebikeClass: 'class1'|'class3'|null,
 *   budget: number,
 *   heightRange: string,
 *   experience: 'first'|'returning'|'regular'|'experienced'|'racer',
 *   primaryUse: string,
 *   zip: string,
 *   radius: number,
 *   // conditional
 *   bikepackingNoCharge: boolean,
 *   roadGroupRides: boolean,
 *   commuteDistance: number,
 * }
 */
export function recommend(profile) {
  const {
    bikeType,
    subtype,
    budget,
    heightRange,
    experience,
    bikepackingNoCharge,
  } = profile;

  const result = {
    headline: '',
    summary: '',
    frameMaterial: '',
    frameMaterialWhy: '',
    suspensionType: '',
    suspensionWhy: '',
    drivetrainType: '',
    drivetrainWhy: '',
    wheelSize: '',
    wheelSizeWhy: '',
    isCustomBuild: false,
    customBuildOptions: null,
    bikes: [],
  };

  // --- Frame material ---
  if (bikeType === 'touring' || bikeType === 'gravel') {
    result.frameMaterial = 'chromoly steel';
    result.frameMaterialWhy = 'Steel is repairable anywhere on earth, absorbs road vibration, and lasts a lifetime. For loaded touring, it\'s the only sensible choice.';
  } else if (bikeType === 'mountain') {
    if (budget < 2500) {
      result.frameMaterial = 'aluminum';
      result.frameMaterialWhy = 'At this budget, aluminum gives you the best stiffness-to-weight ratio. Modern alloy frames are excellent.';
    } else if (budget < 5000) {
      result.frameMaterial = 'aluminum or entry carbon';
      result.frameMaterialWhy = 'You\'re in the sweet spot where premium aluminum and entry carbon both make sense. Your local shop can help you weigh the tradeoffs.';
    } else {
      result.frameMaterial = 'carbon';
      result.frameMaterialWhy = 'At this budget, carbon saves weight and improves ride quality in ways that genuinely matter on technical trails.';
    }
  } else if (bikeType === 'road') {
    if (budget < 2000) {
      result.frameMaterial = 'aluminum';
      result.frameMaterialWhy = 'At this budget, aluminum gives excellent stiffness for power transfer. Save carbon for when budget allows.';
    } else {
      result.frameMaterial = 'aluminum or carbon';
      result.frameMaterialWhy = 'You have options. Carbon saves ~2 lbs and improves ride quality. Your local shop can help you feel the difference.';
    }
  } else {
    result.frameMaterial = 'aluminum';
    result.frameMaterialWhy = 'Aluminum is the practical choice — light, durable, and low maintenance.';
  }

  // --- Suspension ---
  if (bikeType === 'mountain') {
    const isSmallRider = heightRange === '<5\'2"' || heightRange === '5\'2"–5\'4"';
    const isBeginner = experience === 'first' || experience === 'returning';

    if (isBeginner || budget < 2500) {
      result.suspensionType = 'hardtail';
      result.suspensionWhy = isBeginner
        ? 'For your first mountain bike, a hardtail teaches better technique and is easier to maintain. You\'ll get more bike for the money too.'
        : 'At this budget, a quality hardtail outperforms a cheap full-suspension bike every time.';
    } else if (subtype === 'xc') {
      result.suspensionType = 'hardtail or XC full suspension';
      result.suspensionWhy = 'XC racing goes either way. Hardtails are lighter; full suspension is faster on technical courses.';
    } else {
      result.suspensionType = 'full suspension';
      result.suspensionWhy = subtype === 'enduro'
        ? '160mm of travel soaks up everything. Enduro demands full suspension.'
        : '120–140mm travel transforms trail riding. Your body will thank you on longer rides.';
    }
  } else if (bikeType === 'ebike' && subtype === 'mountain') {
    result.suspensionType = 'full suspension';
    result.suspensionWhy = 'E-MTBs need full suspension to handle the extra speed and weight motor assistance brings.';
  } else {
    result.suspensionType = 'rigid';
    result.suspensionWhy = 'No suspension needed here — rigid keeps weight down and maintenance simple.';
  }

  // --- Drivetrain ---
  if ((bikeType === 'touring' && bikepackingNoCharge) || bikeType === 'touring') {
    result.drivetrainType = 'mechanical (Shimano strongly recommended)';
    result.drivetrainWhy = 'Shimano mechanical is the global standard. You can find cable and parts in almost any country. Never trust a battery in the middle of nowhere.';
  } else if (budget < 2000) {
    result.drivetrainType = 'mechanical';
    result.drivetrainWhy = 'At this budget, mechanical drivetrains are more reliable and easier to service. Electronic shifting starts at $2k+.';
  } else if (budget < 5000) {
    result.drivetrainType = 'mechanical (electronic available at top of this range)';
    result.drivetrainWhy = 'Mechanical is the sweet spot here. If you\'re at the top of your budget, ask about electronic — the shift quality is exceptional.';
  } else {
    result.drivetrainType = 'mechanical or electronic';
    result.drivetrainWhy = 'At this budget, electronic shifting is worth considering. It\'s low maintenance, precise, and you can trim it from your phone.';
  }

  // --- Wheel size (MTB) ---
  if (bikeType === 'mountain') {
    const isShortRider = heightRange === '<5\'2"' || heightRange === '5\'2"–5\'4"' || heightRange === '5\'4"–5\'6"';
    if (subtype === 'xc') {
      result.wheelSize = '29"';
      result.wheelSizeWhy = '29ers roll faster and carry momentum better — exactly what XC demands.';
    } else if (subtype === 'enduro' || subtype === 'downhill') {
      result.wheelSize = '29" (or mullet 29/27.5 for enduro)';
      result.wheelSizeWhy = 'Modern enduro bikes run 29ers for rollover speed. A mullet setup (29 front, 27.5 rear) adds playfulness.';
    } else if (isShortRider) {
      result.wheelSize = '27.5"';
      result.wheelSizeWhy = "For your height, 27.5\" wheels give better stand-over clearance and snappier handling.";
    } else {
      result.wheelSize = '29"';
      result.wheelSizeWhy = '29ers are the current standard for trail riding — better rollover, more stability at speed.';
    }
  }

  // --- Custom build flag ---
  if (budget >= 6000 && bikeType !== 'kids' && bikeType !== 'unsure') {
    result.isCustomBuild = true;
    result.customBuildOptions = CUSTOM_BUILD_OPTIONS;
  }

  // --- Headline + summary ---
  result.headline = buildHeadline(profile, result);
  result.summary = buildSummary(profile, result);

  // --- Bike suggestions from seed data ---
  result.bikes = suggestBikes(profile, result);

  return result;
}

function buildHeadline(profile, rec) {
  const { bikeType, subtype, budget } = profile;
  if (rec.isCustomBuild) return "You're in custom build territory.";

  const typeLabel = {
    mountain: subtype ? `${subtype} mountain bike` : 'mountain bike',
    road: 'road bike',
    gravel: 'gravel bike',
    touring: 'touring bike',
    commuter: 'commuter',
    ebike: 'e-bike',
    kids: "kids' bike",
    unsure: 'bike',
  }[bikeType] || 'bike';

  if (budget < 1500) return `Here's a solid ${typeLabel} at your budget.`;
  if (budget < 3500) return `Here's what we'd put you on.`;
  return `Nice — you're shopping in the sweet spot.`;
}

function buildSummary(profile, rec) {
  const parts = [];
  if (rec.frameMaterial) parts.push(`${rec.frameMaterial} frame`);
  if (rec.suspensionType && profile.bikeType === 'mountain') parts.push(rec.suspensionType);
  if (rec.drivetrainType) parts.push(rec.drivetrainType + ' drivetrain');
  return `Your ride: ${parts.join(', ')}.`;
}

function suggestBikes(profile, rec) {
  const { bikeType, subtype, budget } = profile;

  let candidates = SEED_BIKES.filter(b => {
    if (b.type !== bikeType) return false;
    if (subtype && b.subtype && b.subtype !== subtype) return false;
    if (b.msrp > budget * 1.15) return false; // allow 15% over budget
    return true;
  });

  // If no subtype match, relax subtype filter
  if (candidates.length === 0) {
    candidates = SEED_BIKES.filter(b => b.type === bikeType && b.msrp <= budget * 1.15);
  }

  // Sort: first by budget fit (closest to budget without going way over), then karma score
  candidates.sort((a, b) => {
    const aDiff = Math.abs(a.msrp - budget * 0.85);
    const bDiff = Math.abs(b.msrp - budget * 0.85);
    if (Math.abs(aDiff - bDiff) > 300) return aDiff - bDiff;
    return b.karma_score - a.karma_score;
  });

  return candidates.slice(0, 3);
}
