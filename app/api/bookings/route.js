import { supabaseAdmin } from '../../../lib/supabase';
import { notifyCustomerNewBooking } from '../../../lib/notify';
import { pushToAdmin } from '../../../lib/push';
import { sendSMS } from '../../../lib/sms';

// GET /api/bookings?status=new
export async function GET(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('service_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ bookings: data });
}

// POST /api/bookings
export async function POST(request) {
  console.log('[bookings] POST handler reached');
  if (!supabaseAdmin) {
    console.error('[bookings] supabaseAdmin not initialized — check SUPABASE_SERVICE_ROLE_KEY');
    return Response.json({ error: 'Admin client unavailable' }, { status: 500 });
  }

  const body = await request.json();
  const { name, phone, email, lat, lng, address,
          bike_brand, issues, bike_details, notes,
          preferred_day, time_slot, contact_preference, is_member,
          photos, status, confirmed_date, confirmed_time, return_date,
          admin_created, bikes,
          referred_by, booker_phone, booker_name,
          dropoff, send_tracking_sms } = body;
  console.log('[bookings] new booking from:', name, '| email present:', !!email);
  console.log('[bookings] lat/lng from body:', lat, lng);

  if (!name || !phone) {
    return Response.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  const isBoxShip = Array.isArray(bikes) && bikes[0]?.type === 'box_ship';

  const { data, error } = await supabaseAdmin
    .from('service_bookings')
    .insert([{
      name,
      phone,
      email: email || null,
      lat: lat || null,
      lng: lng || null,
      address: address || null,
      bike_brand: bike_brand || null,
      issues: Array.isArray(issues) ? issues : [],
      bike_details: isBoxShip ? (bikes[0]?.bikeDetails || null) : (bike_details || null),
      notes: notes || null,
      service_type: isBoxShip ? 'box_ship' : 'service',
      shipping_destination: isBoxShip ? (bikes[0]?.destination || null) : null,
      include_disassembly: isBoxShip ? !!bikes[0]?.disassembly : false,
      preferred_day: preferred_day || null,
      time_slot: time_slot || null,
      contact_preference: contact_preference || null,
      is_member: is_member === true,
      photos: Array.isArray(photos) && photos.length > 0 ? photos : null,
      status: status || 'new',
      confirmed_date: confirmed_date || null,
      confirmed_time: confirmed_time || null,
      return_date: return_date || null,
      bikes: Array.isArray(bikes) && bikes.length > 0 ? bikes : null,
      referred_by: referred_by || null,
      booker_phone: booker_phone || null,
      booker_name: booker_name || null,
      dropoff: dropoff === true,
    }])
    .select()
    .single();

  if (error) { console.error('[bookings] insert error:', error.message); return Response.json({ error: error.message }, { status: 500 }); }
  console.log('[bookings] inserted lat/lng:', data?.lat, data?.lng);

  // Send tracking link SMS when admin creates a booking from a phone lead
  if (send_tracking_sms && data?.phone) {
    const SMS_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';
    sendSMS(data.phone, `One Love: You're on the schedule. Track your service here: ${SMS_BASE}/service/${data.id}`).catch(err =>
      console.error('[bookings] tracking SMS failed:', err?.message || err)
    );
  }

  // Send SMS confirmation to the person who booked for their friend
  if (booker_phone) {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org';
    const friendFirst = (name || 'your friend').split(' ')[0];
    sendSMS(booker_phone, `One Love: You booked service for ${friendFirst}! Track it here: ${BASE_URL}/service/${data.id}`).catch(err =>
      console.error('[bookings] booker SMS failed:', err?.message || err)
    );
  }

  // Send "we got your request" email to email-preference customers
  if (data.contact_preference === 'email' && data.email) {
    notifyCustomerNewBooking(data).catch(err =>
      console.error('[bookings] new booking customer email failed:', err?.message || err)
    );
  }

  // Admin notification — skip if this booking was created by admin (they know about it already)
  if (admin_created) {
    return Response.json({ booking: data }, { status: 201 });
  }

  // Admin notification — inlined directly, no helper functions
  console.log('[bookings] SENDING ADMIN EMAIL NOW');
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'One Love Outdoors <service@oneloveoutdoors.org>',
      to: ['service@oneloveoutdoors.org'],
      subject: isBoxShip
        ? 'New Box & Ship request — ' + (data.name || 'Unknown')
        : 'New booking — ' + (data.name || 'Unknown') + ' (' + (data.bike_brand || 'No brand') + ')',
      text: isBoxShip
        ? 'New Box & Ship request:\n\nName: ' + data.name + '\nPhone: ' + data.phone + '\nEmail: ' + data.email + '\nPickup address: ' + data.address + '\n' +
          'Destination: ' + (data.shipping_destination || 'Not specified') + '\nBike details: ' + (data.bike_details || 'Not specified') +
          '\nDisassembly requested: ' + (data.include_disassembly ? 'Yes' : 'No') +
          '\nPreferred: ' + (data.preferred_day || '') + ' ' + (data.preferred_time || '') + '\nContact via: ' + (data.contact_preference || '') + '\nNotes: ' + (data.notes || '') + '\n\nView in admin: ' + (process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org') + '/admin/service'
        : 'New bicycle service:\n\nName: ' + data.name + '\nPhone: ' + data.phone + '\nEmail: ' + data.email + '\nAddress: ' + data.address + '\n' +
          (data.bikes?.length > 0
            ? data.bikes.map((b, i) => 'Bike ' + (i+1) + ': ' + (b.brand || '?') + ' — ' + (b.issues || []).join(', ')).join('\n')
            : 'Bike: ' + (data.bike_brand || 'Not specified') + '\nIssues: ' + (data.issues || []).join(', ')) +
          '\nPreferred: ' + (data.preferred_day || '') + ' ' + (data.preferred_time || '') + '\nContact via: ' + (data.contact_preference || '') + '\nNotes: ' + (data.notes || '') + '\n\nView in admin: ' + (process.env.NEXT_PUBLIC_BASE_URL || 'https://service.oneloveoutdoors.org') + '/admin/service',
    });
    console.log('[bookings] ADMIN EMAIL SENT:', JSON.stringify(result));
  } catch (err) {
    console.error('[bookings] ADMIN EMAIL FAILED:', JSON.stringify(err));
  }

  pushToAdmin({ title: 'New booking — ' + (data.name || 'Unknown'), body: data.address || '', url: '/admin/service', tag: 'olo-admin' }).catch(() => {});

  // Fire-and-forget webhook
  const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
  if (webhookUrl && data) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_booking',
        booking_id: data.id,
        name: data.name,
        phone: data.phone,
        bike: data.bike_brand || 'not specified',
        issues: data.issues || [],
        preferred_day: data.preferred_day,
        time_slot: data.time_slot,
        address: data.address,
        notes: data.notes,
      }),
    }).catch(() => {});
  }

  return Response.json({ booking: data }, { status: 201 });
}
