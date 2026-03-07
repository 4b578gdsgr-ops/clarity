import { NextResponse } from 'next/server';
import { getShopsNear, SEED_SHOPS } from '../../../lib/seedShops';

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');
  const radius = parseInt(searchParams.get('radius') || '25');

  if (!zip || zip.length !== 5) {
    return NextResponse.json({ shops: SEED_SHOPS, fallback: true });
  }

  // Geocode the ZIP via Nominatim (OpenStreetMap, no API key required)
  let lat, lng;

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${zip}&format=json&countrycodes=us&limit=1`,
      {
        headers: {
          'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)',
          'Accept-Language': 'en',
        },
      }
    );
    const geoData = await geoRes.json();
    if (geoData?.length) {
      lat = parseFloat(geoData[0].lat);
      lng = parseFloat(geoData[0].lon);
    }
  } catch { /* fall through */ }

  // If we couldn't geocode, return all seed shops
  if (!lat || !lng) {
    return NextResponse.json({ shops: SEED_SHOPS, fallback: true });
  }

  // Try Supabase first
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.from('shops').select('*');
    if (!error && data?.length > 0) {
      const withDistance = data
        .map(shop => ({ ...shop, distance: Math.round(haversineDistance(lat, lng, shop.lat, shop.lng) * 10) / 10 }))
        .filter(shop => shop.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
      return NextResponse.json({ shops: withDistance, center: { lat, lng } });
    }
  } catch { /* fall through to seed data */ }

  // Fall back to seed shops
  const shops = getShopsNear(lat, lng, radius);
  return NextResponse.json({ shops, center: { lat, lng } });
}
