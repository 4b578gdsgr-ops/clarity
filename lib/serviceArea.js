// Polygon covering Hartford + Tolland counties and fringe tier-3 towns.
// Eastern edge stops around the Tolland/Windham county line.
// Points are [lat, lng]. ZIP-based lookup is the authoritative service check;
// this polygon is used as a visual boundary and fallback.
export const SERVICE_AREA_POLYGON = [
  [41.55, -73.01],  // SW (Bristol/Southington area)
  [42.07, -73.01],  // NW (MA border, Granby/Suffield)
  [42.07, -72.45],  // N (Suffield/Somers)
  [41.97, -72.22],  // NE (Stafford/Willington)
  [41.80, -72.07],  // E (Chaplin/Ashford fringe)
  [41.57, -72.22],  // SE (Colchester/Hebron)
  [41.55, -72.55],  // S (Cromwell/Portland)
];

export const SERVICE_AREA_CENTER = { lat: 41.88, lng: -72.65 };
export const SERVICE_AREA_ZOOM = 10;

// Ray-casting point-in-polygon
export function isInServiceArea(lat, lng) {
  const poly = SERVICE_AREA_POLYGON;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
