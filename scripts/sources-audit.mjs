/**
 * Audits all 168+ sources in the questions bank.
 * Verifies Wikipedia article existence via Wikipedia REST API,
 * and classifies external/lexical references.
 *
 *   node scripts/sources-audit.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const questionsPath = join(root, 'scripts', 'questions.json');
const bank = JSON.parse(readFileSync(questionsPath, 'utf8'));

const mcqs = bank.items.filter((i) => i.kind === 'mcq');
const sourcedItems = mcqs.filter((i) => i.data.source && i.data.source.trim());

console.log(`\n📚 إجمالي الأسئلة الموثقة بمصادر: ${sourcedItems.length} / ${mcqs.length}\n`);

const parseSource = (src) => {
  // Extract content inside outermost parentheses after 'مادة:' or 'مقالة:' or 'مقال:'
  const prefixMatch = src.match(/(?:ويكيبيديا|الموسوعة الحرة)[^(]*\((?:مادة|مقالة|مقال|موضوع|عن|مقال مفصل)?\s*:\s*(.+)$/i);
  if (!prefixMatch) return null;
  
  let raw = prefixMatch[1].trim();
  // Strip trailing notes if any (e.g. " — المصفاة والميناء")
  const dashIdx = raw.indexOf(' — ');
  let note = '';
  if (dashIdx !== -1) {
    note = raw.slice(dashIdx);
    raw = raw.slice(0, dashIdx).trim();
  }
  
  // Remove trailing closing parenthesis corresponding to the outer opening parenthesis
  if (raw.endsWith(')')) {
    raw = raw.slice(0, -1).trim();
  }

  let lang = 'ar';
  if (/ويكيبيديا الإيطالية/i.test(src)) lang = 'it';
  if (/ويكيبيديا الإنجليزية|English Wikipedia/i.test(src)) lang = 'en';

  return { title: raw, lang, note };
};

const wikiArticles = [];
const nonWikiSources = [];

for (const item of sourcedItems) {
  const src = item.data.source.trim();
  const parsed = parseSource(src);
  if (parsed && parsed.title) {
    wikiArticles.push({
      id: item.data.id,
      question: item.data.question,
      rawSource: src,
      title: parsed.title,
      lang: parsed.lang,
      file: item.file,
    });
  } else {
    nonWikiSources.push({
      id: item.data.id,
      question: item.data.question,
      rawSource: src,
      file: item.file,
    });
  }
}

console.log(`🔹 مصادر مقالات ويكيبيديا العربية: ${wikiArticles.length}`);
console.log(`🔹 مصادر خارجية ومعجمية وتاريخية: ${nonWikiSources.length}\n`);

// Summary of non-wiki sources
console.log('--- عينة من المصادر غير الويكيبيدية ---');
for (const s of nonWikiSources) {
  console.log(`  • [${s.id}] (${s.rawSource})`);
}
console.log('\n--- جاري فحص مقالات ويكيبيديا العربية عبر API ---');

let verifiedWiki = 0;
let missingWiki = [];

const checkWikiArticle = async (title, lang = 'ar') => {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DbaraTriviaGameAudit/1.0 (contact: test@example.com)'
      }
    });
    if (res.status === 200) {
      const data = await res.json();
      return { ok: true, status: 200, normalizedTitle: data.title, type: data.type };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// Test sample or all in batches of 5 with delay to respect Wikipedia API
const batchSize = 5;
for (let i = 0; i < wikiArticles.length; i += batchSize) {
  const batch = wikiArticles.slice(i, i + batchSize);
  const results = await Promise.all(
    batch.map(async (item) => {
      const res = await checkWikiArticle(item.title, item.lang);
      return { item, res };
    })
  );

  for (const { item, res } of results) {
    if (res.ok) {
      verifiedWiki++;
      process.stdout.write('✓');
    } else {
      missingWiki.push({ ...item, status: res.status });
      process.stdout.write('✗');
    }
  }
  // Brief delay to be polite to Wikipedia API
  await new Promise((r) => setTimeout(r, 100));
}

console.log('\n\n--- 📊 نتائج تدقيق مصادر ويكيبيديا العربية ---');
console.log(`✓ مقالات موجودة ومؤكدة 100%: ${verifiedWiki} / ${wikiArticles.length}`);
if (missingWiki.length > 0) {
  console.log(`✗ مقالات لم يتم العثور عليها بالاسم الدقيق (${missingWiki.length}):`);
  for (const m of missingWiki) {
    console.log(`  - [${m.id}] "${m.title}" (كود الاستجابة: ${m.status}) -> ${m.rawSource}`);
  }
} else {
  console.log('🎉 كافة مقالات ويكيبيديا العربية المشار إليها في بنك الأسئلة صحيحة وموجودة بالفعل!');
}
