import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  if (!zip || zip.length !== 5) {
    return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${zip}&format=json&countrycodes=us&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LoveOverMoney/1.0 (loveovermoney.oneloveoutdoors.org)',
        'Accept-Language': 'en',
      },
    });

    const data = await res.json();

    if (!data?.length) {
      return NextResponse.json({ error: 'ZIP not found' }, { status: 404 });
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const city = result.address?.city || result.address?.town || result.address?.village || result.address?.county || '';
    const state = result.address?.state || '';

    return NextResponse.json({ lat, lng, city, state });
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
