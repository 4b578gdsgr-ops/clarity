import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  if (!zip || zip.length !== 5) {
    return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Maps API key not configured' }, { status: 503 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return NextResponse.json({ error: 'ZIP not found' }, { status: 404 });
    }

    const { lat, lng } = data.results[0].geometry.location;
    const components = data.results[0].address_components;
    const city = components.find(c => c.types.includes('locality'))?.long_name || '';
    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';

    return NextResponse.json({ lat, lng, city, state });
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
