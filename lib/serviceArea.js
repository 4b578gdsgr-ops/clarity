// Simplified polygon covering Hartford + Tolland counties, CT.
// Points are [lat, lng]. Approximation — not exact county borders.
export const SERVICE_AREA_POLYGON = [
  [41.62, -73.01],  // SW Hartford (near Bristol)
  [42.05, -73.01],  // NW Hartford (MA border, Granby/Suffield)
  [42.05, -71.99],  // NE Tolland (MA border)
  [41.75, -71.99],  // SE Tolland
  [41.75, -72.52],  // Tolland/Hartford/Middlesex junction
  [41.62, -72.52],  // SE Hartford
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
