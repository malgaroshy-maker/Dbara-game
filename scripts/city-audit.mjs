/**
 * Reports how much a city can say before it repeats itself.
 *
 *   npm run city:audit
 *
 * A map stage names one curated question, and for a long time that was the only
 * question it could ever ask: replaying a city asked the identical thing every
 * time, while three hundred untagged questions never reached the map at all.
 * `questionForStage` now falls back to the city's other questions and then to
 * the stage's subject, so this counts what that fallback actually has to work
 * with, city by city.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, 'node_modules', '.cache', 'city-audit.mjs');

mkdirSync(dirname(tmp), { recursive: true });
writeFileSync(
  join(dirname(tmp), 'city-audit-entry.ts'),
  `
export { initialCities } from '../../src/data/cities';
export { allQuestions } from '../../src/data/questions';
export { questionForStage } from '../../src/features/map/stageQuestion';
`,
  'utf8'
);

await build({
  entryPoints: [join(dirname(tmp), 'city-audit-entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmp,
  logLevel: 'warning',
});

const { initialCities, allQuestions, questionForStage } = await import(
  pathToFileURL(tmp).href + `?t=${Date.now()}`
);

const REPLAYS = 12;
let worstCity = { id: '', distinct: Infinity };
let thin = 0;

console.log(`إعادة لعب كل مرحلة ${REPLAYS} مرة، مع تسجيل ما رآه اللاعب\n`);
console.log('المدينة'.padEnd(24) + 'أسئلة المدينة   أسئلة مختلفة خلال 12 إعادة');

for (const city of initialCities) {
  const tagged = allQuestions.filter((q) => q.cityId === city.id).length;
  const stage = city.stages.find((s) => s.type === 'multiple_choice');
  if (!stage) continue;

  // A player who replays the same stage, remembering everything they have seen.
  const seen = [];
  const distinct = new Set();
  for (let i = 0; i < REPLAYS; i++) {
    const q = questionForStage(stage.questionId, city.id, seen);
    distinct.add(q.id);
    if (!seen.includes(q.id)) seen.push(q.id);
  }
  if (distinct.size < REPLAYS) thin++;
  if (distinct.size < worstCity.distinct) worstCity = { id: city.id, distinct: distinct.size };
  console.log(
    (city.mapLabel ?? city.arabicName).padEnd(24) +
      String(tagged).padStart(6) +
      String(distinct.size).padStart(22)
  );
}

console.log(
  `\nالأقل تنوعاً: ${worstCity.id} بـ ${worstCity.distinct} سؤالاً مختلفاً` +
    `   |   مدن تكرر قبل ${REPLAYS} إعادات: ${thin}`
);
