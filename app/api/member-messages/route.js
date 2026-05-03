import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';
import { sendSMS } from '../../../lib/sms';
import { pushToPhone, pushToAdmin } from '../../../lib/push';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = 'One Love Outdoors <service@oneloveoutdoors.org>';
const ADMIN_EMAIL = 'service@oneloveoutdoors.org';

function normalizePhone(p) {
  return (p || '').replace(/\D/g, '');
}

// GET /api/member-messages?thread_id=xxx  (member view)
// GET /api/member-messages                (admin — all messages)
export async function GET(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const thread_id = searchParams.get('thread_id');

  let query = supabaseAdmin
    .from('member_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (thread_id) query = query.eq('thread_id', thread_id);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ messages: data });
}

// POST /api/member-messages
// Member message:  { sender: 'member', name, message, email?, phone? }
// Admin reply:     { sender: 'admin', thread_id, message }
// Admin outbound:  { sender: 'admin', phone, message, name? }
export async function POST(request) {
  const body = await request.json();
  const { name, message, email, phone, thread_id, sender = 'member', photo_url } = body;

  if (!message?.trim() && !photo_url) return Response.json({ error: 'Message or photo is required' }, { status: 400 });
  if (sender === 'member' && !name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 });

  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const phoneDigits = phone ? normalizePhone(phone) : null;

  // Resolve thread_id: use provided, or find by phone, or create new
  let resolvedThreadId = thread_id || null;
  if (!resolvedThreadId && phoneDigits) {
    const { data: existing } = await supabaseAdmin
      .from('member_messages')
      .select('thread_id')
      .eq('phone', phoneDigits)
      .order('created_at', { ascending: true })
      .limit(1);
    resolvedThreadId = existing?.[0]?.thread_id || null;
  }
  if (!resolvedThreadId) resolvedThreadId = crypto.randomUUID();

  const { data, error } = await supabaseAdmin
    .from('member_messages')
    .insert([{
      name: name?.trim() || null,
      message: message?.trim() || '',
      email: email?.trim() || null,
      phone: phoneDigits || null,
      thread_id: resolvedThreadId,
      sender,
      unread: true,
      ...(photo_url ? { photo_url } : {}),
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (sender === 'member') {
    // Notify admin by email
    if (resend) {
      resend.emails.send({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: 'Member message — ' + name.trim(),
        text: message.trim() +
          '\n\nFrom: ' + name.trim() +
          (email ? '\nEmail: ' + email.trim() : '') +
          (phoneDigits ? '\nPhone: ' + phoneDigits : '') +
          '\n\n— One Love Member Dashboard',
      }).catch(err => console.error('[member-messages] admin email failed:', err?.message));
    }
    pushToAdmin({
      title: 'Message from ' + (name?.trim() || 'member'),
      body: message.trim().slice(0, 80),
      url: '/admin/service',
      tag: 'olo-admin-msg',
    }).catch(() => {});
  } else if (sender === 'admin') {
    // Find contact info for this thread — prefer phone rows for SMS routing
    const { data: phoneMsgs } = await supabaseAdmin
      .from('member_messages')
      .select('phone, name')
      .eq('thread_id', resolvedThreadId)
      .not('phone', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1);

    const contactPhone = phoneMsgs?.[0]?.phone || phoneDigits;
    const contactName = phoneMsgs?.[0]?.name || name || 'there';

    if (contactPhone) {
      sendSMS(contactPhone, 'One Love: ' + message.trim()).catch(err =>
        console.error('[member-messages] SMS failed:', err?.message)
      );
      pushToPhone(contactPhone, {
        title: 'New message from One Love Outdoors',
        body: message.trim().slice(0, 80),
        url: '/?openTab=messages',
        tag: 'olo-message',
      }).catch(err => console.error('[member-messages] push failed:', err?.message));
    } else {
      // Fall back to email
      const { data: emailMsgs } = await supabaseAdmin
        .from('member_messages')
        .select('email, name')
        .eq('thread_id', resolvedThreadId)
        .eq('sender', 'member')
        .not('email', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1);

      const contactEmail = emailMsgs?.[0]?.email;
      const emailName = emailMsgs?.[0]?.name || contactName;

      if (contactEmail && resend) {
        resend.emails.send({
          from: FROM,
          to: [contactEmail],
          subject: 'New message from One Love Outdoors',
          text: 'Hi ' + emailName + ',\n\n' + message.trim() + '\n\n— One Love Outdoors',
        }).catch(err => console.error('[member-messages] member email failed:', err?.message));
      }
    }
  }

  return Response.json({ message: data, thread_id: resolvedThreadId });
}

// DELETE /api/member-messages?thread_id=xxx
export async function DELETE(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const thread_id = searchParams.get('thread_id');
  if (!thread_id) return Response.json({ error: 'thread_id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('member_messages')
    .delete()
    .eq('thread_id', thread_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

// PATCH /api/member-messages
// body: { thread_id, sender } — marks all messages from that sender in thread as read
export async function PATCH(request) {
  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { thread_id, sender = 'member' } = await request.json();
  if (!thread_id) return Response.json({ error: 'thread_id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('member_messages')
    .update({ unread: false })
    .eq('thread_id', thread_id)
    .eq('sender', sender);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
