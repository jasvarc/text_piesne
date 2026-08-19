const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map();

async function translateWords(words, context) {
  const result = {};
  const toTranslate = [];
  const seen = new Set();

  words.forEach((w) => {
    const key = w.toLowerCase();
    if (cache.has(key)) {
      result[w] = cache.get(key);
    } else if (!seen.has(key)) {
      seen.add(key);
      toTranslate.push(w);
    }
  });

  if (!toTranslate.length || !process.env.ANTHROPIC_API_KEY) {
    return result;
  }

  const list = toTranslate.map((w, i) => `${i + 1}. ${w}`).join('\n');
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system:
      'Si prekladač anglických slov/krátkych fráz z textov piesní do slovenčiny. ' +
      'Pre každú položku v očíslovanom zozname uveď najvhodnejší krátky slovenský ' +
      'preklad (1-3 slová) vzhľadom na kontext piesne. Odpovedaj VÝLUČNE JSON poľom ' +
      'reťazcov v rovnakom poradí ako vstup, napr. ["preklad1","preklad2"], bez ' +
      'akéhokoľvek ďalšieho textu.',
    messages: [
      {
        role: 'user',
        content: `Kontext piesne: ${context}\n\nZoznam na preklad:\n${list}`,
      },
    ],
  });

  const block = message.content[0];
  const raw = block && block.type === 'text' ? block.text : '[]';

  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (err) {
    const match = raw.match(/\[[\s\S]*\]/);
    arr = match ? JSON.parse(match[0]) : [];
  }

  toTranslate.forEach((w, i) => {
    const t = Array.isArray(arr) ? arr[i] : undefined;
    if (typeof t === 'string' && t.trim()) {
      const clean = t.trim();
      cache.set(w.toLowerCase(), clean);
      result[w] = clean;
    }
  });

  return result;
}

module.exports = { translateWords };
