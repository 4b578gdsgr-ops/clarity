import { supabaseAdmin } from '../../../lib/supabase';
import { notifyCustomer } from '../../../lib/notify';

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
          admin_created } = body;
  console.log('[bookings] new booking from:', name, '| email present:', !!email);

  if (!name || !phone) {
    return Response.json({ error: 'Name and phone are required' }, { status: 400 });
  }

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
      bike_details: bike_details || null,
      notes: notes || null,
      preferred_day: preferred_day || null,
      time_slot: time_slot || null,
      contact_preference: contact_preference || null,
      is_member: is_member === true,
      photos: Array.isArray(photos) && photos.length > 0 ? photos : null,
      status: status || 'new',
      confirmed_date: confirmed_date || null,
      confirmed_time: confirmed_time || null,
      return_date: return_date || null,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Notify customer — skip if admin-created with phone-only preference, or no contact info
  const skipNotification = admin_created && (
    contact_preference === 'phone' ||
    (contact_preference !== 'text' && !email)
  );
  console.log('[bookings] about to notify customer — contact_preference:', data.contact_preference, '| skip:', skipNotification);
  if (!skipNotification) {
    try {
      await notifyCustomer('new', data);
      console.log('[bookings] customer notification sent');
    } catch (err) {
      console.error('[bookings] customer notification FAILED:', err?.message || err);
    }
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
      subject: 'New booking — ' + (data.name || 'Unknown') + ' (' + (data.bike_brand || 'No brand') + ')',
      text: 'New bicycle service:\n\nName: ' + data.name + '\nPhone: ' + data.phone + '\nEmail: ' + data.email + '\nAddress: ' + data.address + '\nBike: ' + (data.bike_brand || 'Not specified') + '\nIssues: ' + (data.issues || []).join(', ') + '\nPreferred: ' + (data.preferred_day || '') + ' ' + (data.preferred_time || '') + '\nContact via: ' + (data.contact_preference || '') + '\nNotes: ' + (data.notes || '') + '\n\nView in admin: https://clarity-pi-ten.vercel.app/admin/service',
    });
    console.log('[bookings] ADMIN EMAIL SENT:', JSON.stringify(result));
  } catch (err) {
    console.error('[bookings] ADMIN EMAIL FAILED:', JSON.stringify(err));
  }

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
