/**
 * Content integrity check over every question bank and puzzle file.
 * Exits non-zero on any error, so it can gate a build or a commit.
 *
 *   node scripts/questions-check.mjs
 *
 * Rules mirror the authoring contract documented at the top of
 * `src/data/questions/generalArab.ts`, plus the referential integrity the map
 * and daily challenge depend on.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Reuse the exporter so this check sees exactly what the game imports.
execFileSync(process.execPath, [join(root, 'scripts', 'questions-export.mjs')], { stdio: 'pipe' });
const bank = JSON.parse(readFileSync(join(root, 'scripts', 'questions.json'), 'utf8'));

const errors = [];
const warnings = [];
const fail = (id, msg) => errors.push(`✗ ${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`⚠ ${id}: ${msg}`);

const REWARD_BAND = { easy: [25], medium: [30, 35], hard: [40, 45], expert: [50] };
const ROUND_LENGTH = 5; // QUESTIONS_PER_ROUND in CategoryHub

const mcq = bank.items.filter((i) => i.kind === 'mcq');
const blitz = bank.items.filter((i) => i.kind === 'blitz');
const scrambles = bank.items.filter((i) => i.kind === 'scramble');
const crosswords = bank.items.filter((i) => i.kind === 'crossword');

// ── ids are unique across every bank ────────────────────────────────────────
const seen = new Map();
for (const it of bank.items) {
  const id = it.data.id;
  if (seen.has(id)) fail(id, `معرّف مكرر (${seen.get(id)} و ${it.file})`);
  seen.set(id, it.file);
}

// ── multiple choice ─────────────────────────────────────────────────────────
const questionText = new Map();
for (const { data: q, file } of mcq) {
  if (q.options.length !== 4) fail(q.id, `عدد الخيارات ${q.options.length} بدل 4`);
  if (new Set(q.options).size !== q.options.length) fail(q.id, 'خيارات مكررة');
  if (q.correctIndex < 0 || q.correctIndex >= q.options.length) fail(q.id, 'correctIndex خارج النطاق');
  if (q.options.some((o) => !o.trim())) fail(q.id, 'خيار فارغ');

  // rule 2 — the question must not contain its own answer
  const answer = q.options[q.correctIndex];
  if (answer && q.question.includes(answer)) fail(q.id, `السؤال يحوي إجابته ("${answer}")`);

  // rule 4 — reward follows difficulty
  const band = REWARD_BAND[q.difficulty];
  if (!band) fail(q.id, `صعوبة غير معروفة: ${q.difficulty}`);
  else if (!band.includes(q.rewardDinars))
    fail(q.id, `المكافأة ${q.rewardDinars} لا تطابق مستوى ${q.difficulty} (${band.join('/')})`);

  if (!q.funFact?.trim()) fail(q.id, 'بلا "معلومة ع الماشي"');

  const prev = questionText.get(q.question);
  if (prev) fail(q.id, `نص السؤال مطابق لـ ${prev}`);
  questionText.set(q.question, q.id);

  if (!file.includes('generalArab') && q.category === 'general_arab') {
    warn(q.id, 'تصنيف general_arab خارج بنكه');
  }
}

// rule 5 — answer position must not cluster
const pos = [0, 0, 0, 0];
mcq.forEach(({ data: q }) => pos[q.correctIndex]++);
const worst = Math.max(...pos) / mcq.length;
if (worst > 0.35) {
  errors.push(`✗ موقع الإجابة متكتل: ${pos.join('/')} — أعلى نسبة ${(worst * 100).toFixed(0)}%`);
}

// every category must hold at least two rounds' worth, and offer a real mix
const byCategory = {};
for (const { data: q } of mcq) (byCategory[q.category] ??= []).push(q);
for (const [cat, list] of Object.entries(byCategory)) {
  if (list.length < ROUND_LENGTH * 2)
    fail(cat, `${list.length} أسئلة فقط — الحد الأدنى ${ROUND_LENGTH * 2}`);
  const levels = new Set(list.map((q) => q.difficulty));
  for (const need of ['easy', 'medium', 'hard']) {
    if (!levels.has(need)) fail(cat, `لا يحوي أي سؤال بمستوى ${need}`);
  }
}

// ── speed blitz ─────────────────────────────────────────────────────────────
const yes = blitz.filter((i) => i.data.isCorrect).length;
const skew = Math.abs(yes - (blitz.length - yes)) / blitz.length;
if (skew > 0.1) errors.push(`✗ سباق السرعة مائل: ${yes} صح مقابل ${blitz.length - yes} خطأ`);
for (const { data: s } of blitz) {
  if (!s.statement?.trim()) fail(s.id, 'عبارة فارغة');
  if (!s.explanation?.trim()) fail(s.id, 'بلا شرح');
}

// ── scrambles: the tiles must spell the answer exactly ──────────────────────
for (const { data: p } of scrambles) {
  const answer = [...p.answer.replace(/\s/g, '')].sort().join('');
  const tiles = [...p.scrambledLetters].sort().join('');
  if (answer !== tiles) fail(p.id, `الحروف المبعثرة لا تطابق الإجابة "${p.answer}"`);
  if (p.hint?.includes(p.answer)) warn(p.id, 'التلميح يذكر الإجابة نصاً');
}

// ── crosswords ──────────────────────────────────────────────────────────────
// The letters the in-game keyboard can actually produce (MiniCrossword.tsx).
// Note the absence of أ إ آ — a grid needing one is unsolvable.
const KEYBOARD = new Set([
  'ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج',
  'ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط',
  'ئ','ء','ؤ','ر','ى','ة','و','ز','ظ','د','ذ',
]);

const answerSeenIn = new Map();

for (const { data: c } of crosswords) {
  const covered = new Set();

  for (const clue of c.clues) {
    const prev = answerSeenIn.get(clue.answer);
    if (prev && prev !== c.id) warn(c.id, `الإجابة "${clue.answer}" مستعملة أيضاً في ${prev}`);
    answerSeenIn.set(clue.answer, c.id);
  }

  for (const clue of c.clues) {
    const letters = [];
    for (let k = 0; k < clue.answer.length; k++) {
      const r = clue.row + (clue.direction === 'down' ? k : 0);
      const col = clue.col + (clue.direction === 'across' ? k : 0);
      letters.push(c.grid[r]?.[col] ?? '·');
      covered.add(`${r}-${col}`);
    }
    if (letters.join('') !== clue.answer)
      fail(c.id, `الشبكة تعطي "${letters.join('')}" بينما الدليل ${clue.number} ${clue.direction} إجابته "${clue.answer}"`);
    if (clue.clue.includes(clue.answer)) warn(c.id, `الدليل ${clue.number} يذكر إجابته`);
  }

  c.grid.forEach((row, r) =>
    row.forEach((cell, col) => {
      if (cell === null) return;
      // An uncovered cell can never be filled correctly — the puzzle is unsolvable.
      if (!covered.has(`${r}-${col}`))
        fail(c.id, `الخانة (${r},${col}) لا يغطيها أي دليل`);
      if (!KEYBOARD.has(cell))
        fail(c.id, `الحرف "${cell}" في (${r},${col}) غير موجود على لوحة المفاتيح`);
    })
  );

  if (c.grid.length !== c.gridSize.rows || c.grid.some((r) => r.length !== c.gridSize.cols))
    fail(c.id, 'أبعاد الشبكة لا تطابق gridSize');
}

// ── referential integrity with the map and the daily challenge ──────────────
const ids = new Set(bank.items.map((i) => i.data.id));
const scan = (file, re, label) => {
  const src = readFileSync(join(root, file), 'utf8');
  for (const m of src.matchAll(re)) {
    if (!ids.has(m[1])) errors.push(`✗ ${label}: مرجع معلّق "${m[1]}" في ${file}`);
  }
};
scan('src/data/cities.ts', /(?:questionId|puzzleId): '([a-z0-9_]+)'/g, 'مراحل الخريطة');

// ── the generated daily challenge schedule ──────────────────────────────────
const schedule = bank.dailySchedule ?? [];
if (schedule.length < 365) {
  errors.push(`✗ التحدي اليومي: جدول التحقق ${schedule.length} يوماً فقط`);
}
const scrambleIds = new Set(scrambles.map((i) => i.data.id));
const crosswordIds = new Set(crosswords.map((i) => i.data.id));
const seenOn = { trivia: new Map(), scramble: new Map(), crossword: new Map() };
let sameTypeRun = 1;
let longestRun = 1;

schedule.forEach((c, day) => {
  const where = `التحدي اليومي (${c.date})`;
  if (!c.title?.trim() || !c.description?.trim()) errors.push(`✗ ${where}: بلا عنوان أو وصف`);
  if (!(c.rewardDinars > 0)) errors.push(`✗ ${where}: مكافأة غير صالحة`);

  if (c.type === 'trivia') {
    if (!ids.has(c.questionId)) errors.push(`✗ ${where}: سؤال غير موجود "${c.questionId}"`);
    const prev = seenOn.trivia.get(c.questionId);
    if (prev !== undefined && day - prev < 180)
      errors.push(`✗ ${where}: تكرار سؤال "${c.questionId}" بعد ${day - prev} يوماً فقط`);
    seenOn.trivia.set(c.questionId, day);
  } else if (c.type === 'scramble') {
    if (!scrambleIds.has(c.scrambleId)) errors.push(`✗ ${where}: لغز غير موجود "${c.scrambleId}"`);
    const prev = seenOn.scramble.get(c.scrambleId);
    if (prev !== undefined && day - prev < 60)
      errors.push(`✗ ${where}: تكرار لغز "${c.scrambleId}" بعد ${day - prev} يوماً فقط`);
    seenOn.scramble.set(c.scrambleId, day);
  } else if (c.type === 'crossword') {
    if (!crosswordIds.has(c.crosswordId)) errors.push(`✗ ${where}: شبكة غير موجودة "${c.crosswordId}"`);
    const prev = seenOn.crossword.get(c.crosswordId);
    if (prev !== undefined && day - prev < 60)
      errors.push(`✗ ${where}: تكرار شبكة "${c.crosswordId}" بعد ${day - prev} يوماً فقط`);
    seenOn.crossword.set(c.crosswordId, day);
  } else if (c.type !== 'blitz') {
    errors.push(`✗ ${where}: نوع غير معروف "${c.type}"`);
  }

  if (day > 0) {
    sameTypeRun = c.type === schedule[day - 1].type ? sameTypeRun + 1 : 1;
    longestRun = Math.max(longestRun, sameTypeRun);
  }
});

if (longestRun > 2) errors.push(`✗ التحدي اليومي: ${longestRun} أيام متتالية بنفس النمط`);

const typeMix = schedule.reduce((acc, c) => ({ ...acc, [c.type]: (acc[c.type] ?? 0) + 1 }), {});
if (Object.keys(typeMix).length < 3) errors.push('✗ التحدي اليومي: لا يغطي كل الأنماط');

// ── report ──────────────────────────────────────────────────────────────────
const counts = { 'اختيار من متعدد': mcq.length, 'صح/خطأ': blitz.length, 'ترتيب حروف': scrambles.length, 'متقاطعة': crosswords.length };
console.log(Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join('  |  '));
console.log(`موقع الإجابة: ${pos.join(' / ')}`);
console.log(
  `التحدي اليومي: ${schedule.length} يوماً — ` +
    Object.entries(typeMix).map(([t, n]) => `${t} ${n}`).join(' / ') +
    ` | أسئلة ${seenOn.trivia.size} | ألغاز ${seenOn.scramble.size} | شبكات ${seenOn.crossword.size}`
);

warnings.forEach((w) => console.log(w));
if (errors.length) {
  console.error(`\n${errors.length} خطأ:`);
  errors.forEach((e) => console.error(e));
  process.exit(1);
}
console.log(`\n✓ اجتاز الفحص — ${bank.items.length} سجلاً بلا أخطاء.`);
