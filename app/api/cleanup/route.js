import { runCleanup } from '../../../lib/cleanupBookings';

function getAdminToken(request) {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k.trim() === 'ol_admin') return decodeURIComponent(v || '');
  }
  return null;
}

export async function POST(request) {
  const token = getAdminToken(request);
  const expected = process.env.ADMIN_PASSWORD ? btoa(process.env.ADMIN_PASSWORD) : null;
  if (!token || !expected || token !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cleaned = await runCleanup();
    return Response.json({ cleaned });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
