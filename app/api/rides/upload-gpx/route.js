import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(req) {
  if (!supabaseAdmin) return Response.json({ error: 'Unavailable' }, { status: 500 });

  let formData;
  try { formData = await req.formData(); } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.gpx')) {
    return Response.json({ error: 'File must be a .gpx file' }, { status: 400 });
  }

  const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.gpx';
  const buffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from('ride-gpx')
    .upload(path, buffer, { contentType: 'application/gpx+xml', upsert: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('ride-gpx').getPublicUrl(path);
  return Response.json({ url: publicUrl });
}
