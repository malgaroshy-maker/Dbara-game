/**
 * Screens delegated research before any of it reaches the question bank.
 *
 *   node scripts/verify-findings.mjs agy-work/source-findings.json
 *
 * An earlier automated pass over this bank produced fluent, confident citations
 * that were fabricated — named authorities whose pages did not carry the claim,
 * and twice a quote that contradicted the verdict attached to it. The lesson was
 * not "check harder"; it was that a verdict costs the model nothing to assert,
 * while a verbatim quote can be read back and judged.
 *
 * So this refuses everything the contract cannot support, and prints what
 * survives for a human to read. It cannot tell whether a quote is real — only a
 * person opening the page can — but it removes every finding that fails on its
 * own terms, which is most of what goes wrong.
 */
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('usage: node scripts/verify-findings.mjs <findings.json>');
  process.exit(2);
}

const raw = JSON.parse(readFileSync(path, 'utf8'));
const findings = raw.findings ?? raw.drafts ?? [];
const rejected = [];
const accepted = [];

/** Quotes shorter than this are too fragmentary to state anything. */
const MIN_QUOTE = 25;

for (const f of findings) {
  const id = f.id ?? f.cityId ?? '(unnamed)';
  const problems = [];

  if (!f.quote?.trim()) problems.push('بلا اقتباس');
  else if (f.quote.trim().length < MIN_QUOTE) problems.push(`اقتباس قصير جداً (${f.quote.trim().length} حرفاً)`);

  if (!f.proposition?.trim()) problems.push('بلا دعوى مكتوبة');
  if (!f.sourceTitle?.trim()) problems.push('بلا مصدر مسمّى');

  if (f.quoteStatesProposition !== true && f.verdict === 'confirmed')
    problems.push('حكم "مؤكد" مع إقرار بأن الاقتباس لا يذكر الدعوى');

  // A source title that is just a link defeats the point of storing a name.
  if (/^https?:\/\//i.test(f.sourceTitle ?? '')) problems.push('المصدر رابط لا اسم');

  // The giveaway from last time: a quote that merely shares the topic.
  if (f.quote && f.proposition) {
    const words = (s) =>
      new Set(
        s
          .replace(/[^ء-يa-zA-Z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 4)
      );
    const shared = [...words(f.proposition)].filter((w) => words(f.quote).has(w));
    if (shared.length === 0) problems.push('الاقتباس لا يشترك مع الدعوى في أي كلمة دالة');
  }

  if (problems.length) rejected.push({ id, problems });
  else accepted.push(f);
}

const byVerdict = {};
for (const f of findings) byVerdict[f.verdict ?? 'draft'] = (byVerdict[f.verdict ?? 'draft'] ?? 0) + 1;

console.log(`الوارد: ${findings.length}`);
console.log(`الأحكام: ${Object.entries(byVerdict).map(([k, v]) => `${k} ${v}`).join('  |  ') || '—'}`);
console.log(`مرفوض آلياً: ${rejected.length}   |   يحتاج قراءتك: ${accepted.length}\n`);

if (rejected.length) {
  console.log('── مرفوض ──');
  for (const r of rejected) console.log(`  ✗ ${r.id}: ${r.problems.join('؛ ')}`);
  console.log('');
}

const contradicted = findings.filter((f) => f.verdict === 'contradicted');
if (contradicted.length) {
  console.log('── يدّعي أن الإجابة خاطئة (اقرأ هذه أولاً) ──');
  for (const c of contradicted) console.log(`  ! ${c.id}: ${c.proposition}\n     «${(c.quote ?? '').slice(0, 160)}»`);
  console.log('');
}

console.log('── ناجٍ من الفحص الآلي، وما زال يحتاج قراءة بشرية ──');
for (const a of accepted) {
  console.log(`\n  ${a.id ?? a.cityId} — ${a.sourceTitle}`);
  console.log(`    الدعوى: ${a.proposition}`);
  console.log(`    الاقتباس: «${a.quote.replace(/\s+/g, ' ').slice(0, 220)}»`);
  if (a.sourceUrl) console.log(`    ${a.sourceUrl}`);
}
