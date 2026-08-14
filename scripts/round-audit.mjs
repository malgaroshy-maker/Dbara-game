/**
 * Reports the difficulty shape of quick-play rounds, sampled from the real banks.
 *
 *   npm run round:audit [rounds-per-category]
 *
 * A round used to be five questions drawn at random: it could open on an expert
 * question, and roughly a fifth of rounds carried three or more hard ones. The
 * curve is supposed to fix that, and this is how we know whether it did rather
 * than assuming it.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, 'node_modules', '.cache', 'round-audit.mjs');

mkdirSync(dirname(tmp), { recursive: true });
writeFileSync(
  join(dirname(tmp), 'round-audit-entry.ts'),
  `
export { buildRound, ROUND_CURVE } from '../../src/features/quickplay/roundBuilder';
export { historyQuestions } from '../../src/data/questions/history';
export { dialectQuestions } from '../../src/data/questions/dialects';
export { sportsQuestions } from '../../src/data/questions/sports';
export { foodTraditionsQuestions } from '../../src/data/questions/foodTraditions';
export { generalArabQuestions } from '../../src/data/questions/generalArab';
export { geographyQuestions } from '../../src/data/questions/geography';
export { islamicQuestions } from '../../src/data/questions/islamic';
export { literatureQuestions } from '../../src/data/questions/literature';
export { scienceQuestions } from '../../src/data/questions/science';
`,
  'utf8'
);

await build({
  entryPoints: [join(dirname(tmp), 'round-audit-entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmp,
  logLevel: 'warning',
});

const m = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
const { buildRound, ROUND_CURVE } = m;

const banks = {
  'تاريخ': m.historyQuestions,
  'لهجات': m.dialectQuestions,
  'رياضة': m.sportsQuestions,
  'مطبخ': m.foodTraditionsQuestions,
  'ثقافة عامة': m.generalArabQuestions,
  'جغرافيا': m.geographyQuestions,
  'إسلامية': m.islamicQuestions,
  'أدب': m.literatureQuestions,
  'علوم': m.scienceQuestions,
};

const SAMPLES = Number(process.argv[2] ?? 400);
const SHORT = { easy: 'س', medium: 'م', hard: 'ص', expert: 'خ' };

let openedHard = 0;
let threePlusHard = 0;
let totalRounds = 0;
const slotCounts = ROUND_CURVE.map(() => ({ easy: 0, medium: 0, hard: 0, expert: 0 }));

console.log(`عيّنة ${SAMPLES} جولة لكل تصنيف — لاعب جديد لم يرَ شيئاً\n`);
for (const [name, bank] of Object.entries(banks)) {
  let hardOpens = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const round = buildRound(bank, []);
    totalRounds++;
    round.forEach((q, slot) => {
      if (slot < slotCounts.length) slotCounts[slot][q.difficulty]++;
    });
    if (['hard', 'expert'].includes(round[0]?.difficulty)) {
      hardOpens++;
      openedHard++;
    }
    if (round.filter((q) => ['hard', 'expert'].includes(q.difficulty)).length >= 3) threePlusHard++;
  }
  const sample = buildRound(bank, []).map((q) => SHORT[q.difficulty]).join(' ');
  console.log(`${name.padEnd(12)} مثال: ${sample}   فتح بسؤال صعب: ${hardOpens}/${SAMPLES}`);
}

console.log('\n=== توزيع كل خانة عبر كل الجولات ===');
slotCounts.forEach((counts, slot) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const parts = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([lvl, n]) => `${SHORT[lvl]} ${((100 * n) / total).toFixed(0)}%`)
    .join('  ');
  console.log(`الخانة ${slot + 1} (المطلوب ${SHORT[ROUND_CURVE[slot]]}): ${parts}`);
});

console.log(
  `\nجولات تفتح بسؤال صعب: ${((100 * openedHard) / totalRounds).toFixed(1)}%` +
    `   |   جولات بثلاثة أسئلة صعبة أو أكثر: ${((100 * threePlusHard) / totalRounds).toFixed(1)}%`
);
