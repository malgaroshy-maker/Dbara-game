/**
 * Bundles every question/puzzle data module and dumps them to a single JSON blob
 * that the review page (scripts/questions-review.html) reads.
 *
 *   node scripts/questions-export.mjs
 */
import { build } from 'esbuild';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, 'node_modules', '.cache', 'questions-export.mjs');

const entry = `
export { historyQuestions } from '../../src/data/questions/history';
export { dialectQuestions } from '../../src/data/questions/dialects';
export { sportsQuestions } from '../../src/data/questions/sports';
export { foodTraditionsQuestions } from '../../src/data/questions/foodTraditions';
export { generalArabQuestions } from '../../src/data/questions/generalArab';
export { geographyQuestions } from '../../src/data/questions/geography';
export { islamicQuestions } from '../../src/data/questions/islamic';
export { literatureQuestions } from '../../src/data/questions/literature';
export { scienceQuestions } from '../../src/data/questions/science';
export { speedBlitzQuestionsPool } from '../../src/data/questions/speedBlitz';
export { wordScramblePuzzles } from '../../src/data/puzzles/wordScramble';
export { miniCrosswords } from '../../src/data/puzzles/crosswords';
export { getDailyChallenge } from '../../src/data/puzzles/dailyPuzzles';
`;

mkdirSync(dirname(tmp), { recursive: true });
writeFileSync(join(dirname(tmp), 'questions-entry.ts'), entry, 'utf8');

await build({
  entryPoints: [join(dirname(tmp), 'questions-entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmp,
  logLevel: 'warning',
});

const m = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);

/** file → exported symbol, so the writer knows where each record lives. */
const sources = {
  'src/data/questions/history.ts': 'historyQuestions',
  'src/data/questions/dialects.ts': 'dialectQuestions',
  'src/data/questions/sports.ts': 'sportsQuestions',
  'src/data/questions/foodTraditions.ts': 'foodTraditionsQuestions',
  'src/data/questions/generalArab.ts': 'generalArabQuestions',
  'src/data/questions/geography.ts': 'geographyQuestions',
  'src/data/questions/islamic.ts': 'islamicQuestions',
  'src/data/questions/literature.ts': 'literatureQuestions',
  'src/data/questions/science.ts': 'scienceQuestions',
  'src/data/questions/speedBlitz.ts': 'speedBlitzQuestionsPool',
  'src/data/puzzles/wordScramble.ts': 'wordScramblePuzzles',
  'src/data/puzzles/crosswords.ts': 'miniCrosswords',
};

const kindOf = (file) =>
  file.includes('speedBlitz') ? 'blitz'
  : file.includes('wordScramble') ? 'scramble'
  : file.includes('crosswords') ? 'crossword'
  : 'mcq';

const items = [];
for (const [file, symbol] of Object.entries(sources)) {
  const list = m[symbol];
  if (!Array.isArray(list)) throw new Error(`missing export ${symbol} in ${file}`);
  list.forEach((item, index) => {
    items.push({ file, symbol, kind: kindOf(file), index, data: item });
  });
}

/**
 * A year and a bit of generated daily challenges, so the checker can verify the
 * schedule the same way it verifies hand-written data. The daily challenge has
 * no literal ids left to grep for — it is derived from the date.
 */
const DAILY_HORIZON = 400;
const dailySchedule = [];
{
  const d = new Date(2026, 0, 1);
  for (let i = 0; i < DAILY_HORIZON; i++) {
    const pad = (n) => String(n).padStart(2, '0');
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    dailySchedule.push(m.getDailyChallenge(key));
    d.setDate(d.getDate() + 1);
  }
}

const payload = { generatedAt: new Date().toISOString(), items, dailySchedule };
writeFileSync(join(root, 'scripts', 'questions.json'), JSON.stringify(payload, null, 2), 'utf8');

// Inline the payload so the review page works straight off the filesystem (no fetch).
const template = readFileSync(join(root, 'scripts', 'questions-review.template.html'), 'utf8');
const json = JSON.stringify(payload).replace(/<\//g, '<\\/');
writeFileSync(join(root, 'scripts', 'questions-review.html'), template.replace('__PAYLOAD__', json), 'utf8');

console.log(`exported ${items.length} records from ${Object.keys(sources).length} files`);
console.log('open scripts/questions-review.html');
