import { supabaseAdmin } from '../../../../../lib/supabase';

export async function GET(req, { params }) {
  if (!supabaseAdmin) return new Response('Unavailable', { status: 500 });

  const { id } = params;

  const { data: ride, error } = await supabaseAdmin
    .from('group_rides')
    .select('gpx_url, title')
    .eq('id', id)
    .single();

  if (error || !ride) return new Response('Not found', { status: 404 });
  if (!ride.gpx_url) return new Response('No route file for this ride', { status: 404 });

  // Extract storage object path from the public URL
  const marker = '/ride-gpx/';
  const idx = ride.gpx_url.indexOf(marker);
  if (idx < 0) return new Response('Invalid storage URL', { status: 500 });
  const storagePath = ride.gpx_url.slice(idx + marker.length);

  const { data: blob, error: dlErr } = await supabaseAdmin.storage
    .from('ride-gpx')
    .download(storagePath);

  if (dlErr || !blob) {
    console.error('[rides/gpx] storage download failed:', dlErr?.message, 'path:', storagePath);
    return new Response('File not found in storage', { status: 404 });
  }

  const safeName = (ride.title || 'ride').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename="${safeName}.gpx"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
