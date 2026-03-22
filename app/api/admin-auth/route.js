export async function POST(request) {
  const { password } = await request.json();

  const envPw = process.env.ADMIN_PASSWORD || '';
  const submitted = password || '';

  console.log('[admin-auth] env pw length:', envPw.length, '| submitted length:', submitted.length);
  console.log('[admin-auth] env pw first 3:', JSON.stringify(envPw.slice(0, 3)), '| submitted first 3:', JSON.stringify(submitted.slice(0, 3)));
  console.log('[admin-auth] trimmed match:', envPw.trim() === submitted.trim(), '| exact match:', envPw === submitted);

  if (!envPw || submitted !== envPw) {
    return Response.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = btoa(process.env.ADMIN_PASSWORD);
  const response = Response.json({ ok: true });
  response.headers.set(
    'Set-Cookie',
    `ol_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );
  return response;
}
