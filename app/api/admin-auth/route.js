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
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: 2592000, // 30 days in seconds
  });

  console.log('[admin-auth] cookie set — token length:', token.length);
  return response;
}
