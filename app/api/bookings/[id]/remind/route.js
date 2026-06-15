export async function POST() {
  return Response.json({ error: 'Reminder emails have been removed. Use copy text button instead.' }, { status: 410 });
}
