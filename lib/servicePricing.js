/**
 * Service area ZIP code tiers.
 * To move a ZIP between tiers, just change the number here (15, 25, or 40).
 * To add a new ZIP, add it to the right tier below.
 * ZIPs not listed here are outside the service area.
 */
export const ZIP_TIERS = {

  // ── Tier 1 — $15 ────────────────────────────────────────────────────────────
  // Hartford
  '06101': 15, '06102': 15, '06103': 15, '06104': 15, '06105': 15,
  '06106': 15, '06112': 15, '06114': 15, '06115': 15, '06120': 15,
  // West Hartford
  '06107': 15, '06110': 15, '06117': 15, '06119': 15,
  // East Hartford
  '06108': 15, '06118': 15,
  // Newington
  '06111': 15,
  // Berlin
  '06037': 15,
  // Wethersfield
  '06109': 15,
  // Rocky Hill
  '06067': 15,
  // Cromwell
  '06416': 15,
  // New Britain
  '06051': 15, '06052': 15, '06053': 15,
  // Manchester
  '06040': 15, '06042': 15, '06045': 15,
  // South Windsor
  '06074': 15,
  // Glastonbury
  '06033': 15,
  // Farmington
  '06032': 15,

  // ── Tier 2 — $25 ────────────────────────────────────────────────────────────
  // Avon
  '06001': 25,
  // Simsbury
  '06070': 25,
  // Canton
  '06019': 25,
  // Bristol
  '06010': 25,
  // Plainville
  '06062': 25,
  // Southington
  '06489': 25,
  // Vernon
  '06066': 25,
  // Tolland
  '06084': 25,
  // Ellington
  '06029': 25,
  // Bolton
  '06043': 25,
  // Coventry
  '06238': 25,
  // Middletown
  '06457': 25,
  // Portland
  '06480': 25,
  // Windsor
  '06095': 25,
  // Windsor Locks
  '06096': 25,
  // East Windsor
  '06088': 25,
  // Bloomfield
  '06002': 25,
  // Enfield
  '06082': 25,
  // Suffield
  '06078': 25,

  // ── Tier 3 — $40 ────────────────────────────────────────────────────────────
  // Stafford
  '06076': 40,
  // Somers
  '06071': 40,
  // Granby
  '06035': 40, '06060': 40,
  // East Granby
  '06026': 40,
  // Colchester
  '06415': 40,
  // Hebron
  '06248': 40,
  // Marlborough
  '06447': 40,
  // Andover
  '06232': 40,
  // Columbia
  '06237': 40,
  // Willington
  '06279': 40,
  // Mansfield / Storrs
  '06268': 40, '06269': 40,
  // Ashford
  '06278': 40,
  // Chaplin
  '06235': 40,

};

/**
 * Look up the pickup/delivery fee for a ZIP code.
 * Returns { fee: number, zip: string } or null if outside service area.
 */
export function getPricingTier(zip) {
  if (!zip) return null;
  const clean = String(zip).trim().slice(0, 5);
  const fee = ZIP_TIERS[clean];
  if (fee === undefined) return null;
  return { fee, zip: clean };
}
