// Returns the iCal feed URL with embedded token for the admin copy-button.
// Token stays server-side; client never sees it directly.

export async function GET(request) {
  const token = process.env.SECRET_CALENDAR_TOKEN;
  if (!token) {
    return Response.json({ url: null, error: 'SECRET_CALENDAR_TOKEN not set' });
  }
  const { protocol, host } = new URL(request.url);
  const url = `${protocol}//${host}/api/calendar?token=${token}`;
  return Response.json({ url });
}
