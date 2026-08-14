import type { DifficultyLevel, TriviaQuestion } from '../../types/quiz';

/**
 * How a quick-play round is assembled.
 *
 * Kept apart from the screen that renders it so the rule can be measured
 * directly — `npm run round:audit` samples thousands of rounds against the real
 * banks and reports the shape they come out in. A rule about difficulty that
 * nobody can measure is a rule nobody can tell is working.
 */

export const QUESTIONS_PER_ROUND = 5;

const shuffle = <T,>(list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * The shape of a five-question round, easiest first.
 *
 * A round used to be five questions drawn at random, which meant it could open
 * on an expert question and that roughly a fifth of rounds carried three or
 * more hard ones. A curve makes every round start gently and finish on a real
 * test, so difficulty is something the player climbs rather than something the
 * shuffle decides for them.
 */
export const ROUND_CURVE: DifficultyLevel[] = ['easy', 'easy', 'medium', 'medium', 'hard'];

/** What may stand in for a level the category has run out of, nearest first. */
const SUBSTITUTES: Record<DifficultyLevel, DifficultyLevel[]> = {
  easy: ['easy', 'medium', 'hard', 'expert'],
  medium: ['medium', 'easy', 'hard', 'expert'],
  hard: ['hard', 'expert', 'medium', 'easy'],
  expert: ['expert', 'hard', 'medium', 'easy'],
};

const LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];

/**
 * Builds a round that prefers questions the player has not seen, and ramps.
 *
 * Drawing five at random from a bank of sixteen meant heavy repetition after
 * two or three rounds. Unseen questions come first; only once a level is
 * exhausted does the round fall back to seen ones — so the bank is worked
 * through before anything comes round again.
 *
 * Each slot takes an unseen question of the level the curve asks for, falling
 * back through `SUBSTITUTES` when a category has none left at that level.
 * Rounds shorter than the curve take its opening slots, so a three question
 * round is easy, easy, medium rather than three hard ones.
 */
export const buildRound = (
  questions: TriviaQuestion[],
  seenIds: string[],
  size: number = QUESTIONS_PER_ROUND
): TriviaQuestion[] => {
  const seen = new Set(seenIds);
  // Unseen first within each level, so freshness still wins inside a slot.
  const pool = new Map<DifficultyLevel, TriviaQuestion[]>();
  for (const level of LEVELS) {
    const atLevel = questions.filter((q) => q.difficulty === level);
    pool.set(level, [
      ...shuffle(atLevel.filter((q) => !seen.has(q.id))),
      ...shuffle(atLevel.filter((q) => seen.has(q.id))),
    ]);
  }

  const round: TriviaQuestion[] = [];
  for (let slot = 0; slot < Math.min(size, questions.length); slot++) {
    // Past the curve's length, keep asking for its hardest slot.
    const wanted = ROUND_CURVE[Math.min(slot, ROUND_CURVE.length - 1)];
    for (const level of SUBSTITUTES[wanted]) {
      const next = pool.get(level)?.shift();
      if (next) {
        round.push(next);
        break;
      }
    }
  }
  return round;
};

/**
 * A practice round is the questions the player got wrong, in random order.
 *
 * Deliberately not ramped: the point is to face the ones that beat you, and
 * sorting them easiest-first would just delay that.
 */
export const buildPracticeRound = (
  missed: TriviaQuestion[],
  size: number = QUESTIONS_PER_ROUND
): TriviaQuestion[] => shuffle(missed).slice(0, size);
