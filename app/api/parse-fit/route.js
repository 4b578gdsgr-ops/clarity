import { supabaseAdmin } from '../../../lib/supabase';
import FitParser from 'fit-file-parser';

function parseFit(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list',
    });
    parser.parse(buffer, (error, data) => {
      if (error) reject(new Error(String(error)));
      else resolve(data);
    });
  });
}

function toGpx(points, name) {
  const trkpts = points.map(p => {
    const time = p.timestamp instanceof Date ? `\n      <time>${p.timestamp.toISOString()}</time>` : '';
    return `    <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">
      <ele>${(p.ele || 0).toFixed(1)}</ele>${time}
    </trkpt>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="One Love Outdoors" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export async function POST(req) {
  if (!supabaseAdmin) return Response.json({ error: 'Unavailable' }, { status: 500 });

  let formData;
  try { formData = await req.formData(); }
  catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const file = formData.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.fit')) {
    return Response.json({ error: 'File must be a .fit file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let fitData;
  try { fitData = await parseFit(buffer); }
  catch (err) {
    return Response.json({ error: 'Could not parse FIT file: ' + err.message }, { status: 400 });
  }

  // Extract GPS track points from records
  const records = fitData.records || [];
  const points = records
    .filter(r => r.position_lat != null && r.position_long != null)
    .map(r => ({
      lat: r.position_lat,
      lon: r.position_long,
      ele: r.altitude || 0,
      timestamp: r.timestamp,
    }));

  if (points.length === 0) {
    return Response.json({ error: 'No GPS track points found in this FIT file' }, { status: 400 });
  }

  // Elevation gain (sum of positive climbs)
  let elevGain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].ele - points[i - 1].ele;
    if (diff > 0) elevGain += diff;
  }

  // Distance: prefer session summary, fall back to last record
  const session = (fitData.sessions || [])[0];
  const distanceM = session?.total_distance ?? records[records.length - 1]?.distance ?? 0;

  // Convert to GPX and upload
  const rideName = file.name.replace(/\.fit$/i, '');
  const gpxContent = toGpx(points, rideName);
  const gpxPath = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.gpx';

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('ride-gpx')
    .upload(gpxPath, Buffer.from(gpxContent, 'utf-8'), { contentType: 'application/gpx+xml', upsert: false });

  if (uploadErr) return Response.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('ride-gpx').getPublicUrl(gpxPath);

  return Response.json({
    url: publicUrl,
    point_count: points.length,
    distance_km: Math.round(distanceM / 100) / 10,
    elevation_gain_m: Math.round(elevGain),
  });
}
