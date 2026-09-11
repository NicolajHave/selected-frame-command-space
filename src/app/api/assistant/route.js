// The front-page assistant. Streams a grounded answer back as plain text.
//
// The whole of Standards, Toolbox and News sits in the system prompt with a
// one-hour cache — it only changes on deploy, so the cache holds and every
// question after the first in an hour pays a tenth for that part. Verify with
// the `cache_read` figure this route logs; if it stays at zero, something in
// the prompt is varying between requests.
//
// Claude Sonnet 5 at low effort: a lookup question needs no long deliberation,
// and low effort is what keeps it quick and cheap.

import Anthropic from '@anthropic-ai/sdk';
import { buildKnowledge } from '../../../lib/assistant/knowledge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-5';
const MAX_TURNS = 24;          // messages kept from the conversation
const MAX_CHARS = 2000;        // per message
const RATE = { windowMs: 60_000, max: 20 };

// Per-instance rate limit. Serverless instances do not share memory, so this
// bounds one instance, not the world — enough to stop a runaway tab, not a
// substitute for the app sitting behind Bestseller's own access.
const hits = new Map();
function limited(key) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE.max;
}

function bad(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return bad('The assistant is not configured yet — ANTHROPIC_API_KEY is missing in Vercel.', 503);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return bad('Too many questions at once — give it a minute.', 429);

  let body;
  try { body = await request.json(); } catch { return bad('Invalid JSON body'); }

  // Only the shape the card sends: alternating user/assistant text, last one
  // from the user. Anything else is rejected rather than forwarded.
  const raw = Array.isArray(body?.messages) ? body.messages.slice(-MAX_TURNS) : [];
  const messages = [];
  for (const m of raw) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return bad('Invalid message role');
    const content = String(m.content ?? '').trim().slice(0, MAX_CHARS);
    if (!content) continue;
    messages.push({ role: m.role, content });
  }
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return bad('Ask a question');
  }
  if (messages[0].role !== 'user') messages.shift();

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: buildKnowledge(),
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],
    output_config: { effort: 'low' },
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        // eslint-disable-next-line no-console
        console.log('[assistant]', {
          stop: final.stop_reason,
          in: final.usage.input_tokens,
          cache_write: final.usage.cache_creation_input_tokens,
          cache_read: final.usage.cache_read_input_tokens,
          out: final.usage.output_tokens,
        });
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode('\n\nI can’t help with that one.'));
        }
      } catch (e) {
        // The stream is already open, so the error travels as text.
        const msg =
          e instanceof Anthropic.RateLimitError ? 'The assistant is busy — try again in a moment.'
          : e instanceof Anthropic.AuthenticationError ? 'The assistant’s API key was rejected.'
          : e instanceof Anthropic.APIError ? `The assistant hit an error (${e.status}).`
          : 'The assistant hit an error.';
        controller.enqueue(encoder.encode(`\n\n${msg}`));
        // eslint-disable-next-line no-console
        console.error('[assistant]', e?.message || e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
