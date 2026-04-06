const CENTER_LAT = 41.7658;
const CENTER_LNG = -72.6734;
const RADIUS_M   = 48280; // 30 miles

export const SERVICE_AREA_CENTER = { lat: CENTER_LAT, lng: CENTER_LNG };
export const SERVICE_AREA_ZOOM   = 10;

// Haversine distance in meters
function distanceM(lat, lng) {
  const R  = 6371000;
  const φ1 = CENTER_LAT * Math.PI / 180;
  const φ2 = lat        * Math.PI / 180;
  const Δφ = (lat - CENTER_LAT) * Math.PI / 180;
  const Δλ = (lng - CENTER_LNG) * Math.PI / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInServiceArea(lat, lng) {
  return distanceM(lat, lng) <= RADIUS_M;
}
