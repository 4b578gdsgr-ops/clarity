import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = 'One Love Outdoors <service@oneloveoutdoors.org>';
const ADMIN_EMAIL = 'service@oneloveoutdoors.org';

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
// body: { name, message, email, thread_id (optional), sender ('member'|'admin') }
export async function POST(request) {
  const body = await request.json();
  const { name, message, email, thread_id, sender = 'member' } = body;

  if (!message?.trim()) return Response.json({ error: 'Message is required' }, { status: 400 });
  if (sender === 'member' && !name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 });

  const newThreadId = thread_id || crypto.randomUUID();

  if (!supabaseAdmin) return Response.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('member_messages')
    .insert([{
      name: name?.trim() || null,
      message: message.trim(),
      email: email?.trim() || null,
      thread_id: newThreadId,
      sender,
      unread: true,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (resend) {
    if (sender === 'member') {
      // Notify admin
      resend.emails.send({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: 'Member message — ' + name.trim(),
        text: message.trim() + '\n\nFrom: ' + name.trim() + (email ? '\nReply to: ' + email.trim() : '') + '\n\n— One Love Member Dashboard',
      }).catch(err => console.error('[member-messages] admin email failed:', err?.message));
    } else if (sender === 'admin') {
      // Find member email from thread
      const { data: threadMsgs } = await supabaseAdmin
        .from('member_messages')
        .select('email, name')
        .eq('thread_id', newThreadId)
        .eq('sender', 'member')
        .not('email', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1);

      const memberEmail = threadMsgs?.[0]?.email;
      const memberName = threadMsgs?.[0]?.name || 'there';

      if (memberEmail) {
        resend.emails.send({
          from: FROM,
          to: [memberEmail],
          subject: 'New message from One Love Outdoors',
          text: 'Hi ' + memberName + ',\n\n' + message.trim() + '\n\n— One Love Outdoors',
        }).catch(err => console.error('[member-messages] member email failed:', err?.message));
      }
    }
  }

  return Response.json({ message: data, thread_id: newThreadId });
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
