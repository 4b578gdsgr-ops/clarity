/**
 * serviceZones.js
 * Zone config for service scheduling and pickup/dropoff routing.
 * Edit ZIP arrays, schedule days, fees, and meetupSpots to adjust coverage.
 *
 * Days of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 * No Saturday service runs — Saturdays are for riding.
 *
 * meetupSpots: add real locations here when confirmed.
 * Each spot: { id: string, label: string, address: string|null, lat: number|null, lng: number|null }
 */

export const ZONES = {
  zone_local: {
    label: 'Local',
    color: '#2d8653',
    fees: { member: 0, nonMember: 0 },
    meetupSpots: [], // local zone handled separately — we arrange directly
    zips: [
      '06111',
      '06119', // West Hartford Center
      '06114', // South Hartford
      '06110', // West End Hartford
    ],
  },
  zone_central: {
    label: 'Central',
    color: '#2d8653',
    fees: { member: 0, nonMember: 15 },
    meetupSpots: [
      { id: 'tbd_central', label: 'Meetup location coming soon', address: null, lat: null, lng: null },
    ],
    zips: [
      '06103', '06105', '06106', '06107', '06108', '06109', // Hartford / West Hartford / East Hartford
      '06112', '06118', '06120',
      '06033', '06040', '06042', '06043', // Glastonbury / Manchester / Vernon
      '06095', '06096', // Windsor / Windsor Locks
      '06002', '06010', // Bloomfield / Bristol
    ],
  },
  zone_south: {
    label: 'South',
    color: '#0ea5e9',
    fees: { member: 0, nonMember: 15 },
    meetupSpots: [
      { id: 'tbd_south', label: 'Meetup location coming soon', address: null, lat: null, lng: null },
    ],
    zips: [
      '06037', // Berlin
      '06416', // Cromwell
      '06457', // Middletown
      '06450', '06451', // Meriden
      '06516', '06517', '06518', // West Haven / Hamden
      '06511', '06512', '06513', // New Haven
      '06460', '06461', // Milford
    ],
  },
  zone_west: {
    label: 'West',
    color: '#9333ea',
    fees: { member: 0, nonMember: 15 },
    meetupSpots: [
      { id: 'tbd_west', label: 'Meetup location coming soon', address: null, lat: null, lng: null },
    ],
    zips: [
      '06032', // Farmington
      '06001', // Avon
      '06070', // Simsbury
      '06489', // Southington
      '06477', '06479', // Orange / Plantsville
      '06790', '06791', '06795', // Torrington / Harwinton / Waterbury area
      '06702', '06704', '06705', '06706', '06708', // Waterbury
    ],
  },
};

/**
 * Look up which zone a ZIP belongs to.
 * Returns zone key string or null.
 */
export function getZoneForZip(zip) {
  const clean = zip?.trim().slice(0, 5);
  for (const [key, zone] of Object.entries(ZONES)) {
    if (zone.zips.includes(clean)) return key;
  }
  return null;
}

/**
 * Service + pickup fee for a zone + membership status.
 * Returns { fee: number, isFree: boolean, isLocal: boolean }
 */
export function getPickupFee(zoneKey, isMember) {
  const zone = ZONES[zoneKey];
  if (!zone) return { fee: 0, isFree: true, isLocal: false };
  const fee = isMember ? zone.fees.member : zone.fees.nonMember;
  return { fee, isFree: fee === 0, isLocal: zoneKey === 'zone_local' };
}

/**
 * Available service appointment slots per zone.
 * Returns array of { date, timeSlot } objects for the next 4 weeks.
 * Members get all slots; non-members get first slot only.
 */
export function getAvailableSlots(zoneKey, isMember = false) {
  const schedules = {
    zone_local:   { days: [1, 2, 3, 4], slots: ['9am–12pm', '12pm–3pm', '3pm–6pm'] }, // Mon–Thu, flexible
    zone_central: { days: [2, 4],       slots: ['9am–12pm', '12pm–3pm', '3pm–6pm'] }, // Tue (north), Thu (east)
    zone_south:   { days: [1, 3],       slots: ['9am–12pm', '1pm–4pm'] },              // Mon, Wed
    zone_west:    { days: [3, 4],       slots: ['10am–1pm', '2pm–5pm'] },              // Wed, Thu
  };

  const schedule = schedules[zoneKey];
  if (!schedule) return [];

  const results = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (schedule.days.includes(d.getDay())) {
      const dateStr = d.toISOString().slice(0, 10);
      const slots = isMember ? schedule.slots : schedule.slots.slice(0, 1);
      for (const slot of slots) {
        results.push({ date: dateStr, timeSlot: slot });
      }
    }
  }

  return results;
}
