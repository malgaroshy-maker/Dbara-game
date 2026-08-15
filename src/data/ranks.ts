/**
 * Explorer ranks.
 *
 * The profile carried a `title` that was set once at sign-up and never changed,
 * so the game displayed a rank the player could never advance. These tiers make
 * it real, and they are derived entirely from what the player actually did — no
 * invented standing, no comparison against people who do not exist.
 */

export interface ExplorerRank {
  id: string;
  title: string;
  /** Competitive score at which this rank is reached. */
  minScore: number;
  icon: string;
}

/**
 * Total stars obtainable across all map stages in Libya (95 stages × 3 stars = 285).
 * Kept in sync with `src/data/cities.ts` by the automated guard in `scripts/questions-check.mjs`.
 */
export const TOTAL_MAP_STARS = 285;

/**
 * Thresholds are scaled to the size of the actual game, not guessed. The map
 * holds 285 stars across 95 stages, which alone is worth 9,975 points.
 * Reaching the summit ("شيخ الدبارة") requires ~87-90% comprehensive mastery
 * across stars, correct trivia answers, and streak consistency.
 */
export const explorerRanks: ExplorerRank[] = [
  { id: 'novice', title: 'مستكشف مبتدئ', minScore: 0, icon: '🧭' },
  { id: 'guide', title: 'دليل الدروب', minScore: 500, icon: '🗺️' },
  { id: 'traveller', title: 'رحّالة المدن', minScore: 1500, icon: '🐪' },
  { id: 'keeper', title: 'حافظ التراث', minScore: 3200, icon: '🏛️' },
  { id: 'sage', title: 'جهبذ الأقاليم', minScore: 5800, icon: '⭐' },
  { id: 'master', title: 'شيخ الدبارة', minScore: 9000, icon: '👑' },
];

/**
 * The one definition of the competitive score. It used to live inline in the
 * leaderboard component, which meant nothing else could agree with it.
 */
export const competitiveScore = (input: {
  totalStars: number;
  correctAnswers: number;
  streakDays: number;
}): number =>
  input.totalStars * 35 + input.correctAnswers * 15 + input.streakDays * 20;

export const rankForScore = (score: number): ExplorerRank =>
  [...explorerRanks].reverse().find((r) => score >= r.minScore) ?? explorerRanks[0];

/** The next rank up, or null once the player is at the top. */
export const nextRankAfter = (score: number): ExplorerRank | null =>
  explorerRanks.find((r) => r.minScore > score) ?? null;
