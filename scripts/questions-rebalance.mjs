/**
 * One-off codemod over the MCQ banks:
 *   1. re-rates `difficulty` from the table below (rule 3 in generalArab.ts),
 *   2. snaps `rewardDinars` onto the documented 25 / 30-35 / 40-45 / 50 scale,
 *   3. spreads `correctIndex` evenly across the four slots (rule 5) by swapping
 *      the correct option with the one already sitting in the target slot.
 *
 * Deterministic: the slot assignment uses a fixed seed, so re-running produces
 * the same bank. Run with --check to report without writing.
 *
 *   node scripts/questions-rebalance.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

/**
 * id → difficulty for every MCQ in the bank, written out in full rather than as
 * a diff: the mix is a deliberate shape, not a side effect of spot edits.
 * Ratings follow rule 3 — سهل = يعرفه أغلب اللاعبين، متوسط = يحتاج اطلاعاً،
 * صعب = تفصيلة محددة، خبير = معرفة متخصصة.
 */
const RERATE = {
  // ── history (32) ──────────────────────────────────────────────────────────
  hist_trp_01: 'medium',
  hist_lep_01: 'easy',
  hist_lep_02: 'medium',
  hist_ben_01: 'medium',
  hist_cyr_01: 'expert',
  geo_cyr_01: 'medium',
  hist_ghad_01: 'hard',
  hist_sab_01: 'hard',
  geo_sab_01: 'medium',
  hist_ght_01: 'easy',
  cult_ght_01: 'medium',
  geo_kuf_01: 'medium',
  hist_mis_01: 'hard',
  hist_nal_01: 'medium',
  hist_der_01: 'expert',
  hist_jal_01: 'hard',
  hist_jihad_01: 'easy',
  hist_qardabiya_01: 'hard',
  hist_castillo_01: 'easy',
  hist_ottoman_01: 'hard',
  hist_unesco_01: 'hard',
  hist_independence_01: 'easy',
  hist_ajd_01: 'expert',
  hist_tbk_01: 'easy',
  hist_lep_03: 'hard',
  hist_italian_01: 'medium',
  hist_king_01: 'medium',
  hist_senussi_01: 'medium',
  hist_mukhtar_year_01: 'medium',
  hist_vandals_01: 'expert',
  hist_byzantine_01: 'hard',
  hist_arch_trp_01: 'hard',

  // ── dialects (22) — بنك مفردات، فطبيعته تميل للسهل ────────────────────────
  dia_01: 'easy',
  dia_02: 'easy',
  dia_13: 'easy',
  dia_14: 'easy',
  dia_15: 'medium',
  dia_03: 'medium',
  dia_04: 'hard',
  dia_05: 'medium',
  dia_06: 'medium',
  dia_07: 'hard',
  dia_08: 'easy',
  dia_09: 'medium',
  dia_10: 'easy',
  dia_11: 'expert',
  dia_12: 'easy',
  dia_16: 'easy',
  dia_17: 'easy',
  dia_18: 'easy',
  dia_19: 'medium',
  dia_20: 'medium',
  dia_21: 'medium',
  dia_22: 'hard',

  // ── sports (20) ───────────────────────────────────────────────────────────
  spo_01: 'easy',
  spo_02: 'medium',
  spo_10: 'expert',
  spo_03: 'easy',
  spo_04: 'medium',
  spo_05: 'hard',
  spo_06: 'hard',
  spo_07: 'hard',
  spo_08: 'medium',
  spo_09: 'medium',
  spo_11: 'medium',
  spo_12: 'easy',
  spo_13: 'medium',
  spo_14: 'easy',
  spo_15: 'easy',
  spo_16: 'easy',
  spo_17: 'easy',
  spo_18: 'medium',
  spo_19: 'medium',
  spo_20: 'medium',

  // ── food & traditions (23) ────────────────────────────────────────────────
  food_trp_01: 'easy',
  food_ben_01: 'medium',
  food_ghad_01: 'easy',
  food_bazin_02: 'medium',
  food_mis_01: 'medium',
  food_nal_01: 'hard',
  food_der_01: 'easy',
  food_jal_01: 'hard',
  food_trad_04: 'medium',
  food_trad_05: 'medium',
  food_trad_06: 'medium',
  food_trad_07: 'medium',
  food_trad_08: 'easy',
  food_trad_09: 'hard',
  food_trad_11: 'easy',
  food_trad_12: 'expert',
  food_trad_13: 'easy',
  food_trad_14: 'medium',
  food_trad_15: 'easy',
  food_trad_16: 'hard',
  food_trad_17: 'easy',
  food_trad_18: 'medium',
  food_trad_19: 'hard',

  // ── general (16) — بنك الأساسيات ──────────────────────────────────────────
  gen_01: 'easy',
  gen_13: 'easy',
  gen_29: 'easy',
  gen_30: 'medium',
  gen_05: 'medium',
  gen_07: 'hard',
  gen_19: 'medium',
  gen_31: 'medium',
  gen_32: 'expert',
  gen_33: 'easy',
  gen_34: 'easy',
  gen_35: 'medium',
  gen_36: 'easy',
  gen_37: 'easy',
  gen_38: 'medium',
  gen_39: 'expert',

  // ── geography (32) ────────────────────────────────────────────────────────
  geog_01: 'hard',
  geog_02: 'expert',
  geog_03: 'medium',
  geog_04: 'hard',
  geog_05: 'easy',
  geog_06: 'easy',
  geog_07: 'medium',
  geog_08: 'easy',
  geo_msl_01: 'medium',
  geo_msl_02: 'hard',
  geo_zwr_01: 'easy',
  geo_zwr_02: 'medium',
  geo_gry_01: 'medium',
  geo_gry_02: 'medium',
  geo_srt_01: 'easy',
  geo_ajd_01: 'medium',
  geo_tbk_01: 'medium',
  geo_mzq_01: 'hard',
  geo_jgb_01: 'hard',
  geo_kuf_02: 'expert',
  geog_09: 'medium',
  geog_10: 'easy',
  geog_11: 'easy',
  geog_12: 'medium',
  geog_13: 'hard',
  geog_14: 'easy',
  geog_15: 'easy',
  geog_16: 'medium',
  geog_17: 'medium',
  geog_18: 'hard',
  geog_19: 'easy',
  geog_20: 'hard',

  // ── islamic (16) ──────────────────────────────────────────────────────────
  isl_01: 'easy',
  isl_02: 'easy',
  isl_03: 'easy',
  isl_04: 'medium',
  isl_05: 'easy',
  isl_06: 'easy',
  isl_07: 'easy',
  isl_08: 'hard',
  isl_09: 'medium',
  isl_10: 'medium',
  isl_11: 'expert',
  isl_12: 'hard',
  isl_13: 'medium',
  isl_14: 'easy',
  isl_15: 'medium',
  isl_16: 'medium',

  // ── literature (16) ───────────────────────────────────────────────────────
  lit_01: 'easy',
  lit_02: 'medium',
  lit_03: 'hard',
  lit_04: 'easy',
  lit_05: 'medium',
  lit_06: 'medium',
  lit_07: 'easy',
  lit_08: 'expert',
  lit_09: 'hard',
  lit_10: 'hard',
  lit_11: 'medium',
  lit_12: 'medium',
  lit_13: 'expert',
  lit_14: 'easy',
  lit_15: 'medium',
  lit_16: 'hard',

  // ── science (18) — لا يحتوي سؤال خبير، وهذا مقصود لا سهو ──────────────────
  sci_01: 'easy',
  sci_02: 'easy',
  sci_03: 'easy',
  sci_04: 'easy',
  sci_05: 'medium',
  sci_06: 'medium',
  sci_07: 'easy',
  sci_08: 'easy',
  sci_09: 'easy',
  sci_10: 'medium',
  sci_11: 'medium',
  sci_12: 'easy',
  sci_13: 'medium',
  sci_14: 'hard',
  sci_15: 'hard',
  sci_16: 'hard',
  sci_17: 'medium',
  sci_18: 'hard',
};

/** Keeps an existing in-band reward, otherwise snaps to the band's floor. */
const REWARD_BAND = { easy: [25], medium: [30, 35], hard: [40, 45], expert: [50] };

const FILES = [
  'src/data/questions/history.ts',
  'src/data/questions/dialects.ts',
  'src/data/questions/sports.ts',
  'src/data/questions/foodTraditions.ts',
  'src/data/questions/generalArab.ts',
  'src/data/questions/geography.ts',
  'src/data/questions/islamic.ts',
  'src/data/questions/literature.ts',
  'src/data/questions/science.ts',
];

/** mulberry32 — small deterministic PRNG so the layout is reproducible. */
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Balanced multiset of slots 0..3, shuffled with the given seed. */
function slotPlan(count, seed) {
  const slots = [];
  for (let i = 0; i < count; i++) slots.push(i % 4);
  const rand = rng(seed);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
}

/** Splits the body of an options array into its top-level string literals. */
function splitOptions(body) {
  const parts = [];
  let cur = '', inStr = false, quote = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      cur += ch;
      if (ch === '\\') { cur += body[++i]; continue; }
      if (ch === quote) { parts.push(cur); cur = ''; inStr = false; }
      continue;
    }
    if (ch === "'" || ch === '"') { inStr = true; quote = ch; cur = ch; }
  }
  return parts;
}

let totalMoved = 0, totalRerated = 0, totalReward = 0;
const dist = {};

for (const rel of FILES) {
  const path = join(root, rel);
  let src = readFileSync(path, 'utf8');

  // Each question object starts at its `id:` line; the block runs to the next one.
  const idRe = /(^ {4}id: '([a-z0-9_]+)',$)/gm;
  const starts = [...src.matchAll(idRe)].map((m) => ({ index: m.index, id: m[2] }));
  const blocks = starts.map((s, i) => ({
    id: s.id,
    from: s.index,
    to: i + 1 < starts.length ? starts[i + 1].index : src.length,
  }));

  const plan = slotPlan(blocks.length, 20260814);

  // Rewrite back-to-front so earlier offsets stay valid.
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    let text = src.slice(b.from, b.to);

    // 1. difficulty
    const curDiff = /difficulty: '(\w+)'/.exec(text)?.[1];
    const newDiff = RERATE[b.id] || curDiff;
    if (!curDiff) continue;
    if (newDiff !== curDiff) {
      text = text.replace(/difficulty: '\w+'/, `difficulty: '${newDiff}'`);
      totalRerated++;
    }
    dist[rel.split('/').pop()] ??= { easy: 0, medium: 0, hard: 0, expert: 0 };
    dist[rel.split('/').pop()][newDiff]++;

    // 2. reward follows difficulty
    const curReward = Number(/rewardDinars: (\d+)/.exec(text)?.[1]);
    const band = REWARD_BAND[newDiff];
    const newReward = band.includes(curReward) ? curReward : band[0];
    if (newReward !== curReward) {
      text = text.replace(/rewardDinars: \d+/, `rewardDinars: ${newReward}`);
      totalReward++;
    }

    // 3. answer slot — swap the correct option into its assigned position
    const optMatch = /options: \[([\s\S]*?)\],\n/.exec(text);
    const ciMatch = /correctIndex: (\d)/.exec(text);
    if (optMatch && ciMatch) {
      const opts = splitOptions(optMatch[1]);
      const from = Number(ciMatch[1]);
      const to = plan[i];
      if (opts.length === 4 && from !== to) {
        [opts[from], opts[to]] = [opts[to], opts[from]];
        const multiline = optMatch[1].includes('\n');
        const rendered = multiline
          ? `options: [\n${opts.map((o) => `      ${o},`).join('\n')}\n    ],\n`
          : `options: [${opts.join(', ')}],\n`;
        text = text.replace(/options: \[[\s\S]*?\],\n/, rendered);
        text = text.replace(/correctIndex: \d/, `correctIndex: ${to}`);
        totalMoved++;
      }
    }

    src = src.slice(0, b.from) + text + src.slice(b.to);
  }

  if (!check) writeFileSync(path, src, 'utf8');
}

console.log(`difficulty re-rated: ${totalRerated}`);
console.log(`rewards snapped:     ${totalReward}`);
console.log(`answers repositioned:${totalMoved}`);
console.table(dist);
if (check) console.log('(--check: nothing written)');
