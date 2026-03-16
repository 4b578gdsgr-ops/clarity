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
  // Returns "20240315T093000" (local time for TZID= property)
  return dateStr.replace(/-/g, '') + 'T' +
    String(hour).padStart(2, '0') + String(minute).padStart(2, '0') + '00';
}

function dtstampNow() {
  return new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

// Parse "9am-12pm", "12pm-3pm", "1pm-4pm", "3pm-6pm", "10am-2pm" etc.
function parseSlot(slotStr) {
  const match = slotStr?.match(/^(\d+)(am|pm)\s*[-–]\s*(\d+)(am|pm)$/i);
  if (!match) return { startH: 9, endH: 12 }; // safe fallback

  let [, sh, sp, eh, ep] = match;
  sh = parseInt(sh); eh = parseInt(eh);
  if (sp.toLowerCase() === 'pm' && sh !== 12) sh += 12;
  if (ep.toLowerCase() === 'pm' && eh !== 12) eh += 12;
  if (sp.toLowerCase() === 'am' && sh === 12) sh = 0;
  if (ep.toLowerCase() === 'am' && eh === 12) eh = 0;
  return { startH: sh, endH: eh };
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
    .in('status', ['booked', 'picked_up'])
    .order('pickup_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) return new Response('DB error', { status: 500 });

  const stamp = dtstampNow();

  const events = (bookings || []).map(b => {
    let startH, startMin = 0, endH, endMin = 0;
    if (b.preferred_time) {
      // Admin has set an exact time — use it with a 1-hour window
      const [h, m] = b.preferred_time.split(':').map(Number);
      startH = h; startMin = m;
      endH = h + 1; endMin = m;
    } else {
      ({ startH, endH } = parseSlot(b.time_slot));
    }
    const dtstart = dtFormat(b.pickup_date, startH, startMin);
    const dtend   = dtFormat(b.pickup_date, endH, endMin);

    const title = b.bike_brand
      ? `${b.name} — ${b.bike_brand} service`
      : `${b.name} — bike service`;

    const location = [b.address, b.city, b.state, b.zip].filter(Boolean).join(', ');

    const descLines = [];
    if (b.issues?.length) descLines.push(`Issues: ${b.issues.join(', ')}`);
    if (b.bike_brand || b.bike_model) descLines.push(`Bike: ${[b.bike_brand, b.bike_model].filter(Boolean).join(' ')}`);
    if (b.preferred_time) descLines.push(`Exact time: ${b.preferred_time}`);
    if (b.pickup_type === 'meetup') descLines.push(`Meetup${b.meetup_spot ? `: ${b.meetup_spot}` : ''}`);
    if (b.phone)  descLines.push(`Phone: ${b.phone}`);
    if (b.email)  descLines.push(`Email: ${b.email}`);
    descLines.push(`Member: ${b.is_member ? 'Yes ♥' : 'No'}`);
    if (b.zone)   descLines.push(`Zone: ${b.zone}`);
    descLines.push(`Status: ${b.status}`);
    if (b.notes)  descLines.push(`Notes: ${b.notes}`);

    const description = descLines.map(escape).join('\\n');
    const categories  = b.is_member ? 'MEMBER,SERVICE' : 'SERVICE';

    return [
      'BEGIN:VEVENT',
      `UID:booking-${b.id}@loveovermoney`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/New_York:${dtstart}`,
      `DTEND;TZID=America/New_York:${dtend}`,
      fold(`SUMMARY:${escape(title)}`),
      fold(`LOCATION:${escape(location)}`),
      fold(`DESCRIPTION:${description}`),
      `CATEGORIES:${categories}`,
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
