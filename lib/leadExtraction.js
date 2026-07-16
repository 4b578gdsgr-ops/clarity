import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const EXTRACTION_MODEL = 'claude-sonnet-4-6';

function buildPrompt(transcript) {
  return `Read this phone call transcript and extract:
- caller_name (or null)
- caller_phone (or null)
- bike_issue (or null)
- address (or null)
- is_service_call: true/false
- is_junk: true/false (telemarketer, wrong number, robocall, no real conversation)

Return JSON only, no other text.

Transcript: ${transcript}`;
}

function parseExtractionJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Runs a phone call transcript through Claude to recover fields Retell's own
// extraction missed. Shared by the webhook (real-time, service calls only)
// and the admin "Auto-review" bulk pass (backfill on existing leads).
export async function extractLeadFromTranscript(transcript) {
  if (!anthropic || !transcript || !transcript.trim()) return null;

  try {
    const response = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 512,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: buildPrompt(transcript) }],
    });
    const textBlock = response.content.find(b => b.type === 'text');
    return parseExtractionJSON(textBlock?.text);
  } catch (err) {
    console.error('[leadExtraction] Claude extraction failed:', err?.message || err);
    return null;
  }
}
