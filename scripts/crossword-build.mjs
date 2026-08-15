/**
 * Builds 4×4 mini-crosswords by search rather than by hand.
 *
 * Hand-placing an interlocking grid is where mistakes live: a single letter out
 * of step and the grid says one thing while the clue says another, which the
 * content gate catches but only after the fact. So the layout is solved here
 * and the human work stays where it belongs — choosing the words and writing
 * the clues.
 *
 * Two layouts, both already present in the hand-written grids:
 *
 *   TIGHT                        OFFSET
 *     A1 A1 A1 A1                  A1 A1 A1 A1
 *     D1  ·  D2  ·                 D1  ·  D2  ·
 *     A2 A2 A2  ·                   ·  A2 A2 A2
 *      ·  ·  D2  ·                  ·  ·  D2  ·
 *
 * TIGHT forces four shared letters and is the harder to satisfy; OFFSET slides
 * the second across word one column over, which drops it to three and opens up
 * far more of the vocabulary. Both leave every filled cell covered by a clue,
 * which is the gate's first rule about grids.
 *
 *   node scripts/crossword-build.mjs            # report what it can build
 *   node scripts/crossword-build.mjs --emit     # print TypeScript entries
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORDS, TITLES } from './crossword-words.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const emit = process.argv.includes('--emit');

const KEYBOARD = new Set([
  'ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج',
  'ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط',
  'ئ','ء','ؤ','ر','ى','ة','و','ز','ظ','د','ذ',
]);

// Answers already in the bank. Reusing one is only a warning, but a player who
// meets the same word twice in a fortnight notices, so they are excluded.
const existing = new Set(
  [...readFileSync(join(root, 'src/data/puzzles/crosswords.ts'), 'utf8')
    .matchAll(/answer: '([^']+)'/g)].map((m) => m[1])
);

const seenAnswer = new Set();
const pool = WORDS.filter((w) => {
  if (existing.has(w.answer) || seenAnswer.has(w.answer)) return false;
  if (![3, 4].includes(w.answer.length)) return false;
  if ([...w.answer].some((ch) => !KEYBOARD.has(ch))) return false;
  // A clue that contains its own answer gives the puzzle away.
  if (w.clue.includes(w.answer)) return false;
  seenAnswer.add(w.answer);
  return true;
});

const three = pool.filter((w) => w.answer.length === 3);
const four = pool.filter((w) => w.answer.length === 4);

/** Indexes words by the letter at a position, so the search does not rescan. */
const index = (list, pos) => {
  const m = new Map();
  for (const w of list) {
    const k = w.answer[pos];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(w);
  }
  return m;
};
const threeByFirst = index(three, 0);

/**
 * The two layouts, each described by where its words sit and what letters they
 * must share. `a2col` is the only thing that differs, but it changes whether
 * the second across word has to agree with the first down word at all.
 */
const SHAPES = {
  tight: {
    a2col: 0,
    // A2 meets D1 at (2,0) and D2 at (2,2).
    fits: (a2, d1, d2) => a2.answer[0] === d1.answer[2] && a2.answer[2] === d2.answer[2],
  },
  offset: {
    a2col: 1,
    // A2 clears D1 entirely and meets D2 at (2,2) only.
    fits: (a2, _d1, d2) => a2.answer[1] === d2.answer[2],
  },
};

/** mulberry32 — deterministic, so a given seed always rebuilds the same set. */
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const shuffled = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * One greedy packing under a given word order.
 *
 * Greedy alone strands words: an early grid takes a letter-rich word that four
 * later grids needed, and the run ends short. A grid is cheap to test, so the
 * order is shuffled and the whole packing retried — the best of many runs beats
 * any single clever heuristic here, and a fixed seed keeps it reproducible.
 */
const pack = (seed) => {
  const rand = rng(seed);
  const order = shuffled(pool, rand);
  const used = new Set();
  const built = [];

  for (const a1 of order) {
    if (used.has(a1.answer)) continue;
    let done = false;

    for (const d1 of shuffled(threeByFirst.get(a1.answer[0]) ?? [], rand)) {
      if (d1.answer === a1.answer || used.has(d1.answer)) continue;

      for (const d2 of shuffled(threeByFirst.get(a1.answer[2]) ?? [], rand)) {
        // d2 must differ from a1 as well: a1 is not marked used until the grid
        // is committed, so without this a word can clue itself twice in one grid.
        if (used.has(d2.answer) || d2.answer === d1.answer || d2.answer === a1.answer) continue;

        for (const [name, shape] of shuffled(Object.entries(SHAPES), rand)) {
          // OFFSET puts A2 in columns 1..3, so it must be exactly 3 letters.
          const candidates = shape.a2col === 1 ? three : pool;
          const a2 = shuffled(candidates, rand).find(
            (w) =>
              !used.has(w.answer) &&
              w.answer !== a1.answer && w.answer !== d1.answer && w.answer !== d2.answer &&
              // A 4-letter A2 at col 0 would fill (2,3), which no down clue reaches.
              (shape.a2col !== 0 || w.answer.length === 3) &&
              shape.fits(w, d1, d2)
          );
          if (!a2) continue;

          built.push({ a1, a2, d1, d2, shape: name });
          [a1, a2, d1, d2].forEach((w) => used.add(w.answer));
          done = true;
          break;
        }
        if (done) break;
      }
      if (done) break;
    }
  }
  return built;
};

let grids = [];
let bestSeed = 0;
for (let seed = 1; seed <= 6000; seed++) {
  const attempt = pack(seed);
  if (attempt.length > grids.length) { grids = attempt; bestSeed = seed; }
}

/** Renders one solved quadruple into the shape the data file expects. */
const render = (g, meta) => {
  const col = SHAPES[g.shape].a2col;
  const grid = Array.from({ length: 4 }, () => Array(4).fill(null));
  [...g.a1.answer].forEach((ch, i) => (grid[0][i] = ch));
  [...g.a2.answer].forEach((ch, i) => (grid[2][col + i] = ch));
  [...g.d1.answer].forEach((ch, i) => (grid[i][0] = ch));
  [...g.d2.answer].forEach((ch, i) => (grid[i][2] = ch));

  const cell = (c) => (c === null ? 'null' : `'${c}'`);
  const rows = grid.map((r) => `      [${r.map(cell).join(', ')}],`).join('\n');
  const clue = (n, dir, w, row, c) =>
    `      { number: ${n}, direction: '${dir}', clue: '${w.clue}', answer: '${w.answer}', row: ${row}, col: ${c} },`;

  return `  {
    id: '${meta.id}',
    title: '${meta.title}',
    gridSize: { rows: 4, cols: 4 },
    grid: [
${rows}
    ],
    clues: [
${clue(1, 'across', g.a1, 0, 0)}
${clue(2, 'across', g.a2, 2, col)}
${clue(1, 'down', g.d1, 0, 0)}
${clue(3, 'down', g.d2, 0, 2)}
    ],
    funFact: '${meta.fact}',
    rewardDinars: 50,
  },`;
};

if (emit) {
  grids.forEach((g, i) => {
    const t = TITLES[i];
    if (!t) return;
    console.log(render(g, t));
  });
} else {
  console.log(`مفردات صالحة: ${pool.length} (٣ حروف: ${three.length}، ٤ حروف: ${four.length})`);
  console.log(`شبكات مبنية: ${grids.length} (البذرة ${bestSeed})`);
  const byShape = grids.reduce((a, g) => ({ ...a, [g.shape]: (a[g.shape] ?? 0) + 1 }), {});
  console.log(`الأشكال: ${JSON.stringify(byShape)}`);
  grids.forEach((g, i) =>
    console.log(`  ${String(i + 1).padStart(2)}. ${g.a1.answer} / ${g.a2.answer}  ×  ${g.d1.answer} / ${g.d2.answer}`)
  );
}
