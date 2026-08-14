/**
 * One-off codemod: re-prices every question and stage to the new economy.
 *
 *   node scripts/economy-rebalance.mjs
 *
 * The old spread paid 25 for an easy question and 50 for an expert one. Twice
 * the money for many times the difficulty is why the reward stopped meaning
 * anything — and with a perfect round paying over 250 against lifelines costing
 * 15 to 40, dinars piled up with nothing to spend them on.
 *
 * The new bands are steeper and smaller, so a hard question is worth reaching
 * for and the balance is worth watching. Kept in the repo as the record of how
 * every number moved.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Question payout by difficulty: a six-fold spread, where it used to be two. */
const REWARD = { easy: 10, medium: 20, hard: 35, expert: 60 };

/** Stage payouts scale down by this, so the map keeps its shape but not its inflation. */
const STAGE_SCALE = 0.4;

let questionsChanged = 0;
const bankDir = join(root, 'src', 'data', 'questions');
for (const file of readdirSync(bankDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
  const path = join(bankDir, file);
  let source = readFileSync(path, 'utf8');

  // Each record ends with its reward; rewrite it from the difficulty above it.
  source = source.replace(
    /difficulty: '(easy|medium|hard|expert)',([\s\S]*?)rewardDinars: (\d+),/g,
    (whole, level, middle, current) => {
      const next = REWARD[level];
      if (Number(current) !== next) questionsChanged++;
      return `difficulty: '${level}',${middle}rewardDinars: ${next},`;
    }
  );
  writeFileSync(path, source);
}

// Map stages carry their own payout, awarded instead of the question's.
const citiesPath = join(root, 'src', 'data', 'cities.ts');
let cities = readFileSync(citiesPath, 'utf8');
let stagesChanged = 0;
cities = cities.replace(/rewardDinars: (\d+)/g, (_whole, value) => {
  // Round to a five so the numbers stay readable in the UI.
  const next = Math.max(10, Math.round((Number(value) * STAGE_SCALE) / 5) * 5);
  if (next !== Number(value)) stagesChanged++;
  return `rewardDinars: ${next}`;
});
writeFileSync(citiesPath, cities);

console.log(`أسئلة أُعيد تسعيرها: ${questionsChanged}`);
console.log(`مراحل أُعيد تسعيرها: ${stagesChanged}`);
console.log(`الجدول الجديد: ${Object.entries(REWARD).map(([k, v]) => `${k} ${v}`).join('  ')}`);
