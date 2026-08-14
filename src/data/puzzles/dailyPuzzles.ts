import type { DailyChallengeItem } from '../../types/puzzle';
import type { QuizCategory } from '../../types/quiz';
import { allQuestions } from '../questions';
import { wordScramblePuzzles } from './wordScramble';
import { miniCrosswords } from './crosswords';

/**
 * The daily challenge is **derived from the date**, not scheduled by hand.
 *
 * The previous version was a three-item array with fixed dates. Once those
 * three days passed it fell back to `list[dateHash % 3]`, so the "daily"
 * challenge became the same three puzzles forever — each still wearing a title
 * written for one specific day.
 *
 * Properties this generator holds to:
 *
 * - **Deterministic.** The same date yields the same challenge on every device
 *   and every reinstall, with no stored state. That is what lets two people
 *   compare "today's challenge" without a server.
 * - **No repeat until the pool is exhausted.** Each type walks its pool by a
 *   stride coprime with the pool size, which visits every entry exactly once
 *   before revisiting any. Actual windows at today's content sizes:
 *     · معلومة  — 3 days a week over 195 questions ≈ 15 months
 *     · حروف    — 1 day a week over 17 puzzles     ≈ 4 months
 *     · متقاطعة — 1 day a week over 18 grids       ≈ 4 months
 *     · سرعة    — never literally repeats; the mode samples 10 of 50 statements
 *   Growing a pool widens its window automatically.
 * - **Varied within the week.** A fixed weekly pattern rather than a uniform
 *   random type, so a player never gets the same mode four days running.
 */

/**
 * Weekly shape: knowledge-heavy, with one word puzzle, one grid and two speed
 * days. Keeping each puzzle type to a single day a week is what stretches the
 * small puzzle pools into a long no-repeat window.
 */
const WEEK_PATTERN: DailyChallengeItem['type'][] = [
  'trivia',
  'blitz',
  'trivia',
  'scramble',
  'trivia',
  'blitz',
  'crossword',
];

/** What clearing each type pays. Puzzles pay more than a single question. */
const REWARD: Record<DailyChallengeItem['type'], number> = {
  trivia: 30,
  scramble: 45,
  blitz: 55,
  crossword: 60,
};

const CATEGORY_LABEL: Record<QuizCategory, string> = {
  history: 'تاريخ وآثار ليبيا',
  dialects: 'لهجات وأمثال شعبية',
  sports: 'كورة ورياضة',
  food_traditions: 'مطبخ وعادات',
  geography: 'جغرافيا',
  islamic: 'دين وحضارة إسلامية',
  literature: 'لغة وأدب',
  science: 'علوم وطبيعة',
  general_arab: 'ثقافة عامة',
};

const SCRAMBLE_LABEL: Record<string, string> = {
  proverb: 'مثل شعبي',
  slang: 'مفردة ليبية',
  dish: 'من المطبخ الليبي',
  landmark: 'معلم ليبي',
  sports: 'من الرياضة الليبية',
};

/** Day zero. Any fixed past date works; this one keeps day numbers small. */
const EPOCH = Date.UTC(2026, 0, 1);
const MS_PER_DAY = 86_400_000;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * A step size coprime with `size`, so repeatedly adding it cycles through every
 * index exactly once. Starts near the golden-ratio point to scatter
 * consecutive picks instead of walking the pool in order.
 */
const strideFor = (size: number): number => {
  if (size <= 2) return 1;
  let stride = Math.max(1, Math.floor(size * 0.618));
  for (let i = 0; i < size; i++) {
    const candidate = stride + i;
    if (gcd(candidate % size || size, size) === 1) return candidate % size || 1;
  }
  return 1;
};

/**
 * Whole days between the epoch and a `YYYY-MM-DD` key, parsed as UTC so the
 * arithmetic never crosses a daylight-saving seam. The key itself is produced
 * from the player's *local* date by `todayKey`, which is what makes the
 * challenge roll over at their midnight.
 */
const dayNumber = (dateKey: string): number => {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / MS_PER_DAY);
};

/** Nth occurrence of a type, counting only the days that ran that type. */
const occurrenceOf = (day: number, type: DailyChallengeItem['type']): number => {
  const perWeek = WEEK_PATTERN.filter((t) => t === type).length;
  const weeks = Math.floor(day / WEEK_PATTERN.length);
  const within = WEEK_PATTERN.slice(0, day % WEEK_PATTERN.length).filter((t) => t === type).length;
  return weeks * perWeek + within;
};

/** Picks the nth item from a pool, visiting every entry before repeating. */
const pick = <T,>(pool: T[], n: number): T => pool[(n * strideFor(pool.length)) % pool.length];

/**
 * The challenge for a given local date key (`YYYY-MM-DD`).
 * Pure and cheap — safe to call on every render.
 */
export const getDailyChallenge = (dateKey: string): DailyChallengeItem => {
  // Negative day numbers (a device clock set before the epoch) would break the
  // modulo, so the schedule is clamped rather than allowed to run backwards.
  const day = Math.max(0, dayNumber(dateKey));
  const type = WEEK_PATTERN[day % WEEK_PATTERN.length];
  const nth = occurrenceOf(day, type);
  const rewardDinars = REWARD[type];

  if (type === 'trivia') {
    const q = pick(allQuestions, nth);
    return {
      date: dateKey,
      title: `تحدي اليوم: ${CATEGORY_LABEL[q.category]}`,
      description: 'سؤال واحد مختار ليومك — أجب إجابة صحيحة واكسب دنانير مضاعفة.',
      type,
      questionId: q.id,
      rewardDinars,
    };
  }

  if (type === 'scramble') {
    const p = pick(wordScramblePuzzles, nth);
    return {
      date: dateKey,
      title: `تحدي اليوم: ${SCRAMBLE_LABEL[p.category] ?? 'لغز حروف'}`,
      description: 'رتّب الحروف للوصول إلى الكلمة الصحيحة، ولك تلميح إن احتجت.',
      type,
      scrambleId: p.id,
      rewardDinars,
    };
  }

  if (type === 'crossword') {
    const p = pick(miniCrosswords, nth);
    return {
      date: dateKey,
      title: `تحدي اليوم: ${p.title}`,
      description: 'شبكة كلمات متقاطعة صغيرة — أربعة أدلة وحروف متشابكة.',
      type,
      crosswordId: p.id,
      rewardDinars,
    };
  }

  return {
    date: dateKey,
    title: 'تحدي اليوم: سباق الزمن',
    description: 'صح أم خطأ؟ أجب عن أكبر عدد من العبارات قبل نفاد الوقت.',
    type,
    rewardDinars,
  };
};
