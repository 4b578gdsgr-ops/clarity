import { supabaseAdmin } from '../../../lib/supabase';

// ─── iCal helpers ─────────────────────────────────────────────────────────────

function escape(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// RFC 5545 line folding: max 75 octets, fold with CRLF + space
function fold(line) {
  if (line.length <= 75) return line;
  const chunks = [];
  let pos = 0;
  chunks.push(line.slice(0, 75));
  pos = 75;
  while (pos < line.length) {
    chunks.push(' ' + line.slice(pos, pos + 74));
    pos += 74;
  }
  return chunks.join('\r\n');
}

function dtFormat(dateStr, hour, minute = 0) {
  return dateStr.replace(/-/g, '') + 'T' +
    String(hour).padStart(2, '0') + String(minute).padStart(2, '0') + '00';
}

function dtstampNow() {
  return new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

const TIMEZONE_BLOCK = `BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11
END:STANDARD
END:VTIMEZONE`;

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const expected = process.env.SECRET_CALENDAR_TOKEN;

  if (!expected || token !== expected) {
    return new Response('Unauthorized', { status: 401, headers: { 'Content-Type': 'text/plain' } });
  }

  if (!supabaseAdmin) {
    return new Response('Server error', { status: 500 });
  }

  const { data: bookings, error } = await supabaseAdmin
    .from('service_bookings')
    .select('*')
    .in('status', ['confirmed', 'picked_up'])
    .not('confirmed_date', 'is', null)
    .order('confirmed_date', { ascending: true })
    .order('confirmed_time', { ascending: true });

  if (error) return new Response('DB error', { status: 500 });

  const stamp = dtstampNow();

  const events = (bookings || []).map(b => {
    let startH = 9, startMin = 0, endH = 10, endMin = 0;

    if (b.confirmed_time) {
      const [h, m] = b.confirmed_time.split(':').map(Number);
      startH = h; startMin = m;
      endH = h + 1; endMin = m;
    } else if (b.time_slot === 'afternoon') {
      startH = 13; endH = 14;
    }

    const dtstart = dtFormat(b.confirmed_date, startH, startMin);
    const dtend   = dtFormat(b.confirmed_date, endH, endMin);

    const title = b.bike_brand
      ? `${b.name} — ${b.bike_brand} service`
      : `${b.name} — bike service`;

    const descLines = [];
    if (b.issues?.length) descLines.push(`Issues: ${b.issues.join(', ')}`);
    if (b.bike_brand)     descLines.push(`Bike: ${b.bike_brand}`);
    if (b.confirmed_time) descLines.push(`Time: ${b.confirmed_time}`);
    if (b.address)        descLines.push(`Address: ${b.address}`);
    if (b.phone)          descLines.push(`Phone: ${b.phone}`);
    if (b.email)          descLines.push(`Email: ${b.email}`);
    descLines.push(`Status: ${b.status}`);
    if (b.notes)          descLines.push(`Notes: ${b.notes}`);

    const description = descLines.map(escape).join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:booking-${b.id}@loveovermoney`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/New_York:${dtstart}`,
      `DTEND;TZID=America/New_York:${dtend}`,
      fold(`SUMMARY:${escape(title)}`),
      fold(`DESCRIPTION:${description}`),
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].join('\r\n');
  });

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//One Love Outdoors//Service Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:One Love Service',
    'X-WR-TIMEZONE:America/New_York',
    TIMEZONE_BLOCK,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="service.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
