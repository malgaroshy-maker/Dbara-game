/**
 * Appends reviewed city-question drafts into the right bank file.
 *
 *   node scripts/apply-city-drafts.mjs agy-work/city-drafts.json
 *
 * The drafts arrive from delegated research without ids, rewards or placement —
 * deliberately, so the research pass could not write into the banks itself. This
 * assigns all three, and leaves every other rule to `questions:check`, which is
 * the thing that actually decides whether a question may ship.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const drafts = JSON.parse(readFileSync(process.argv[2], 'utf8')).drafts ?? [];

/** Matches REWARD_BAND in questions-check.mjs. */
const REWARD = { easy: 10, medium: 20, hard: 35, expert: 60 };

const BANK = {
  history: 'history.ts',
  dialects: 'dialects.ts',
  sports: 'sports.ts',
  food_traditions: 'foodTraditions.ts',
  geography: 'geography.ts',
  islamic: 'islamic.ts',
  literature: 'literature.ts',
  science: 'science.ts',
  general_arab: 'generalArab.ts',
};

const PREFIX = {
  history: 'hist',
  dialects: 'dia',
  sports: 'spo',
  food_traditions: 'food',
  geography: 'geo',
  islamic: 'isl',
  literature: 'lit',
  science: 'sci',
  general_arab: 'gen',
};

/** Short, readable city tags so an id still says where it belongs. */
const CITY_TAG = {
  bani_walid: 'bwl', msallata: 'msl', zuwara: 'zwr', gharyan: 'gry',
  nalut_nafusa: 'nal', misrata: 'mis', benghazi: 'ben', ajdabiya: 'ajd',
  cyrene_green_mountain: 'cyr', derna: 'der', tobruk: 'tbk', jalu_awjila: 'jal',
  ghadames: 'ghad', sabha_fezzan: 'sab', ghat_akakus: 'ght', kufra_desert: 'kuf',
  zawiya: 'zaw', zliten: 'zlt', al_marj: 'mrj', jufrah: 'jfr', ubari: 'ubr',
  tripoli: 'trp', leptis_magna: 'lep', sirte: 'srt', jaghbub: 'jgb', murzuq: 'mzq',
};

const bankDir = join(root, 'src', 'data', 'questions');
const sources = Object.fromEntries(
  Object.entries(BANK).map(([cat, file]) => [cat, readFileSync(join(bankDir, file), 'utf8')])
);
const taken = new Set([...Object.values(sources).join('\n').matchAll(/id: '([a-z0-9_]+)'/g)].map((m) => m[1]));

const esc = (s) => String(s).replace(/'/g, "\\'");
const added = [];

for (const d of drafts) {
  const prefix = PREFIX[d.category];
  const tag = CITY_TAG[d.cityId];
  if (!prefix || !tag) {
    console.error(`✗ تخطّي: تصنيف أو مدينة غير معروفة (${d.category} / ${d.cityId})`);
    continue;
  }
  let n = 2;
  let id = `${prefix}_${tag}_${String(n).padStart(2, '0')}`;
  while (taken.has(id)) id = `${prefix}_${tag}_${String(++n).padStart(2, '0')}`;
  taken.add(id);

  const lines = [
    '  {',
    `    id: '${id}',`,
    `    category: '${d.category}',`,
    `    cityId: '${d.cityId}',`,
    `    difficulty: '${d.difficulty}',`,
    `    question: '${esc(d.question)}',`,
    `    options: [${d.options.map((o) => `'${esc(o)}'`).join(', ')}],`,
    `    correctIndex: ${d.correctIndex},`,
    `    funFact: '${esc(d.funFact)}',`,
  ];
  if (d.hint) lines.push(`    hint: '${esc(d.hint)}',`);
  lines.push(`    rewardDinars: ${REWARD[d.difficulty]},`);
  if (d.sourceTitle) lines.push(`    source: '${esc(d.sourceTitle)}',`);
  lines.push('  },');

  const file = BANK[d.category];
  const src = sources[d.category];
  const close = src.lastIndexOf('];');
  sources[d.category] = src.slice(0, close) + lines.join('\n') + '\n' + src.slice(close);
  added.push(`${id} (${d.cityId})`);
}

for (const [cat, text] of Object.entries(sources)) writeFileSync(join(bankDir, BANK[cat]), text);
console.log(`أُضيف ${added.length} سؤالاً:`);
console.log(added.join('\n'));
