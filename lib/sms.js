import twilio from 'twilio';

const client = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const FROM = process.env.TWILIO_PHONE_NUMBER || null;

// Normalize to E.164 — handles 10-digit US numbers and 11-digit 1XXXXXXXXXX
function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

/**
 * Send an SMS via Twilio.
 * Throws if Twilio is not configured or the send fails.
 */
export async function sendSMS(to, body) {
  if (!client) throw new Error('Twilio not configured — check TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN');
  if (!FROM)   throw new Error('TWILIO_PHONE_NUMBER env var not set');
  const result = await client.messages.create({ body, from: FROM, to: normalizePhone(to) });
  return result;
}
