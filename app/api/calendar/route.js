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

function dtFormat(dateStr, timeStr) {
  const [h, m] = timeStr ? timeStr.split(':').map(Number) : [9, 0];
  return dateStr.replace(/-/g, '') + 'T' +
    String(h).padStart(2, '0') + String(m).padStart(2, '0') + '00';
}

function dtEnd(dateStr, timeStr) {
  const [h, m] = timeStr ? timeStr.split(':').map(Number) : [9, 0];
  return dtFormat(dateStr, `${h + 1}:${String(m).padStart(2, '0')}`);
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

function makeEvent(uid, stamp, title, dateStr, timeStr, location, descLines) {
  const dtstart = dtFormat(dateStr, timeStr);
  const dtend   = dtEnd(dateStr, timeStr);
  const description = descLines.map(escape).join('\\n');
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}@oneloveoutdoors`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=America/New_York:${dtstart}`,
    `DTEND;TZID=America/New_York:${dtend}`,
    fold(`SUMMARY:${escape(title)}`),
    fold(`DESCRIPTION:${description}`),
  ];
  if (location) lines.push(fold(`LOCATION:${escape(location)}`));
  lines.push('STATUS:CONFIRMED', 'END:VEVENT');
  return lines.join('\r\n');
}

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

  // Fetch pickups: confirmed status with confirmed_date
  const { data: pickups, error: pickupErr } = await supabaseAdmin
    .from('service_bookings')
    .select('*')
    .in('status', ['confirmed', 'picked_up'])
    .not('confirmed_date', 'is', null)
    .order('confirmed_date', { ascending: true });

  // Fetch deliveries: ready/out_for_delivery with return_date
  const { data: deliveries, error: deliveryErr } = await supabaseAdmin
    .from('service_bookings')
    .select('*')
    .in('status', ['ready', 'out_for_delivery'])
    .not('return_date', 'is', null)
    .order('return_date', { ascending: true });

  if (pickupErr || deliveryErr) return new Response('DB error', { status: 500 });

  const stamp = dtstampNow();
  const events = [];

  for (const b of (pickups || [])) {
    const bikePart = b.bike_brand || (b.bikes?.[0]?.brand) || '';
    const title = `PICKUP — ${b.name || 'Unknown'}${bikePart ? ` (${bikePart})` : ''}`;
    const descLines = [];
    if (b.phone)  descLines.push(`Phone: ${b.phone}`);
    if (b.email)  descLines.push(`Email: ${b.email}`);
    if (b.notes)  descLines.push(`Notes: ${b.notes}`);
    descLines.push(`Status: ${b.status}`);
    events.push(makeEvent(`pickup-${b.id}`, stamp, title, b.confirmed_date, b.confirmed_time, b.address, descLines));
  }

  for (const b of (deliveries || [])) {
    const bikePart = b.bike_brand || (b.bikes?.[0]?.brand) || '';
    const title = `DELIVERY — ${b.name || 'Unknown'}${bikePart ? ` (${bikePart})` : ''}`;
    const location = b.delivery_address || b.address || '';
    const descLines = [];
    if (b.phone)            descLines.push(`Phone: ${b.phone}`);
    if (b.email)            descLines.push(`Email: ${b.email}`);
    if (b.delivery_address) descLines.push(`Deliver to: ${b.delivery_address}`);
    else if (b.address)     descLines.push(`Address: ${b.address}`);
    if (b.notes)            descLines.push(`Notes: ${b.notes}`);
    descLines.push(`Status: ${b.status}`);
    events.push(makeEvent(`delivery-${b.id}`, stamp, title, b.return_date, b.delivery_time, location, descLines));
  }

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
