/**
 * Appends letter-scramble puzzles from a JSON file to the puzzle bank.
 *
 * The tiles are derived here rather than typed by hand: `scrambledLetters` must
 * be exactly the answer's letters, and a hand-typed list that drops or doubles
 * one produces a puzzle that cannot be solved. Deriving them makes that class
 * of mistake impossible instead of merely detectable.
 *
 *   node scripts/apply-scrambles.mjs <file.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src/data/puzzles/wordScramble.ts');
const input = process.argv[2];
if (!input) {
  console.error('استعمال: node scripts/apply-scrambles.mjs <file.json>');
  process.exit(1);
}

const entries = JSON.parse(readFileSync(input, 'utf8'));
let src = readFileSync(target, 'utf8');

const existingIds = new Set([...src.matchAll(/id: '([a-z0-9_]+)'/g)].map((m) => m[1]));
const existingAnswers = new Set([...src.matchAll(/^ {4}answer: '([^']+)'/gm)].map((m) => m[1]));

/** mulberry32, seeded per puzzle so a rebuild produces identical tiles. */
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seedOf = (s) => [...s].reduce((a, ch) => (a * 31 + ch.codePointAt(0)) | 0, 7);

/** Shuffles the answer's letters, refusing to hand back the answer in order. */
const tilesFor = (answer) => {
  const letters = [...answer.replace(/\s/g, '')];
  const rand = rng(seedOf(answer));
  let out = letters;
  for (let attempt = 0; attempt < 12; attempt++) {
    out = [...letters];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    // A puzzle that opens already solved is not a puzzle.
    if (out.join('') !== letters.join('')) break;
  }
  return out;
};

const problems = [];
const rendered = [];

for (const e of entries) {
  if (existingIds.has(e.id)) { problems.push(`${e.id}: معرّف مكرر`); continue; }
  if (existingAnswers.has(e.answer)) { problems.push(`${e.id}: الإجابة "${e.answer}" مستعملة`); continue; }
  if (e.hint.includes(e.answer)) { problems.push(`${e.id}: التلميح يذكر الإجابة`); continue; }
  existingIds.add(e.id);
  existingAnswers.add(e.answer);

  const tiles = tilesFor(e.answer).map((c) => `'${c}'`).join(', ');
  // cityId is optional: a puzzle about the dialect as a whole does not belong
  // to one city, and pinning it to an arbitrary one would be a small lie.
  const city = e.cityId ? `\n    cityId: '${e.cityId}',` : '';
  rendered.push(`  {
    id: '${e.id}',${city}
    category: '${e.category}',
    prompt: '${e.prompt}',
    answer: '${e.answer}',
    scrambledLetters: [${tiles}],
    hint: '${e.hint}',
    funFact: '${e.funFact}',
    rewardDinars: ${e.rewardDinars},
  },`);
}

if (problems.length) {
  console.error('مشاكل:\n' + problems.map((p) => `  ✗ ${p}`).join('\n'));
  process.exit(1);
}

const cut = src.rstrip ? 0 : src.lastIndexOf('\n];');
src = src.slice(0, cut) + '\n' + rendered.join('\n') + '\n];\n';
writeFileSync(target, src, 'utf8');
console.log(`أُضيف ${rendered.length} لغزاً`);
