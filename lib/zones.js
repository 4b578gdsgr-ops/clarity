/**
 * zones.js
 * Zone config for pickup routing.
 * Edit ZIP arrays to adjust coverage.
 */

export const ZONES = {
  zone_central: {
    label: 'Central',
    color: '#2d8653',
    zips: [
      '06103', '06105', '06106', '06107', '06108', '06109', // Hartford / West Hartford / East Hartford
      '06110', '06112', '06114', '06118', '06119', '06120',
      '06033', '06040', '06042', '06043', // Glastonbury / Manchester / Vernon
      '06095', '06096', // Windsor / Windsor Locks
      '06002', '06010', // Bloomfield / Bristol
    ],
  },
  zone_south: {
    label: 'South',
    color: '#0ea5e9',
    zips: [
      '06111', // Newington
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
 * Available pickup slots per zone.
 * Returns array of { date, timeSlot } objects for the next 4 weeks.
 * Members get all slots; non-members get a subset.
 */
export function getAvailableSlots(zoneKey, isMember = false) {
  const schedules = {
    zone_central: { days: [2, 4], slots: ['9am–12pm', '12pm–3pm', '3pm–6pm'] }, // Tue, Thu
    zone_south:   { days: [1, 3], slots: ['9am–12pm', '1pm–4pm'] },              // Mon, Wed
    zone_west:    { days: [3, 5], slots: ['10am–1pm', '2pm–5pm'] },              // Wed, Fri
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
