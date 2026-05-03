import { supabaseAdmin } from '../../../../lib/supabase';
import { pushToAdmin } from '../../../../lib/push';

function normalizePhone(p) {
  return (p || '').replace(/\D/g, '');
}

async function getThreadIdForPhone(digits) {
  const { data } = await supabaseAdmin
    .from('member_messages')
    .select('thread_id')
    .eq('phone', digits)
    .order('created_at', { ascending: true })
    .limit(1);
  return data?.[0]?.thread_id || null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  if (!phone) return Response.json({ error: 'phone required' }, { status: 400 });

  const digits = normalizePhone(phone);
  if (digits.length < 7) return Response.json({ error: 'invalid phone' }, { status: 400 });

  const { data: messages, error } = await supabaseAdmin
    .from('member_messages')
    .select('*')
    .eq('phone', digits)
    .order('created_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ messages: messages || [], canMessage: true });
}

export async function POST(req) {
  const { phone, name, message } = await req.json();
  if (!phone || !message?.trim()) {
    return Response.json({ error: 'phone and message required' }, { status: 400 });
  }

  const digits = normalizePhone(phone);
  let thread_id = await getThreadIdForPhone(digits);
  if (!thread_id) thread_id = crypto.randomUUID();

  const { data, error } = await supabaseAdmin
    .from('member_messages')
    .insert([{
      thread_id,
      phone: digits,
      name: name?.trim() || null,
      message: message.trim(),
      sender: 'member',
      unread: true,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  pushToAdmin({
    title: 'Message from ' + (name?.trim() || 'customer'),
    body: message.trim().slice(0, 80),
    url: '/admin/service',
    tag: 'olo-admin-msg',
  }).catch(() => {});

  return Response.json({ message: data }, { status: 201 });
}
