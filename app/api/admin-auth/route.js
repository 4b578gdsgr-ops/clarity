import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();

  const envPw = process.env.ADMIN_PASSWORD || '';
  const submitted = password || '';

  console.log('[admin-auth] env pw length:', envPw.length, '| submitted length:', submitted.length);
  console.log('[admin-auth] match:', envPw === submitted);

  if (!envPw || submitted !== envPw) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = btoa(process.env.ADMIN_PASSWORD);
  const response = NextResponse.json({ ok: true });

  response.cookies.set('ol_admin', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  console.log('[admin-auth] cookie set — token length:', token.length);
  return response;
}
