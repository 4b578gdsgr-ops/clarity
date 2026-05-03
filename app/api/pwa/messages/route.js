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

  // Resolve thread for this phone
  const thread_id = await getThreadIdForPhone(digits);
  console.log('[pwa/messages] GET phone:', digits, '| thread_id:', thread_id);

  if (!thread_id) {
    return Response.json({ messages: [], canMessage: true });
  }

  // Fetch all messages in the thread — including admin replies (which have phone=null)
  const { data: messages, error } = await supabaseAdmin
    .from('member_messages')
    .select('*')
    .eq('thread_id', thread_id)
    .order('created_at', { ascending: true });

  console.log('[pwa/messages] GET returned', messages?.length, 'messages for thread', thread_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ messages: messages || [], canMessage: true });
}

export async function POST(req) {
  const { phone, name, message, photo_url } = await req.json();
  if (!phone || (!message?.trim() && !photo_url)) {
    return Response.json({ error: 'phone and message or photo required' }, { status: 400 });
  }

  const digits = normalizePhone(phone);
  let thread_id = await getThreadIdForPhone(digits);
  const isNew = !thread_id;
  if (!thread_id) thread_id = crypto.randomUUID();
  console.log('[pwa/messages] POST phone:', digits, '| thread_id:', thread_id, '| new thread:', isNew);

  const { data, error } = await supabaseAdmin
    .from('member_messages')
    .insert([{
      thread_id,
      phone: digits,
      name: name?.trim() || null,
      message: message?.trim() || '',
      sender: 'member',
      unread: true,
      ...(photo_url ? { photo_url } : {}),
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
