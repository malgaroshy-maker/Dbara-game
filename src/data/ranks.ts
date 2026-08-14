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
 * Thresholds are scaled to the size of the actual game, not guessed. The map
 * holds 231 stars, which alone is worth 8,085 points, so an early draft topping
 * out at 2,000 crowned a player who had opened barely a third of Libya.
 */
export const explorerRanks: ExplorerRank[] = [
  { id: 'novice', title: 'مستكشف مبتدئ', minScore: 0, icon: '🧭' },
  { id: 'guide', title: 'دليل الدروب', minScore: 400, icon: '🗺️' },
  { id: 'traveller', title: 'رحّالة المدن', minScore: 1200, icon: '🐪' },
  { id: 'keeper', title: 'حافظ التراث', minScore: 2500, icon: '🏛️' },
  { id: 'sage', title: 'جهبذ الأقاليم', minScore: 4500, icon: '⭐' },
  { id: 'master', title: 'شيخ الدبارة', minScore: 7000, icon: '👑' },
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
