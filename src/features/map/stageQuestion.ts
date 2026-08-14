import { allQuestions, questionById } from '../../data/questions';
import type { TriviaQuestion } from '../../types/quiz';

/**
 * Picks the question a map stage should ask this time.
 *
 * Every stage names one curated question, chosen to sit with the stage's title,
 * and that is what a player meets first — the pairing is the point of the map.
 * But a stage is replayable, and a fixed id meant replaying a city asked the
 * identical question forever, which is the repetition players actually notice.
 * Only 49 of the bank's questions are tagged to a city, so the other three
 * hundred never appeared on the map at all.
 *
 * So the curated question is a preference, not a fixture: once it has been
 * seen, the stage draws an unseen one from the same city, then from the same
 * category, and only falls back to the original when everything is exhausted.
 */
export const questionForStage = (
  questionId: string | undefined,
  cityId: string,
  seenIds: string[]
): TriviaQuestion => {
  const curated = questionId ? questionById(questionId) : undefined;
  const seen = new Set(seenIds);

  // First time through, the stage asks exactly what it was written to ask.
  if (curated && !seen.has(curated.id)) return curated;

  const unseen = allQuestions.filter((q) => !seen.has(q.id));
  const pick = <T,>(list: T[]): T | undefined =>
    list.length ? list[Math.floor(Math.random() * list.length)] : undefined;

  // Nearest first: this city, then the subject the stage is about.
  const sameCity = pick(unseen.filter((q) => q.cityId === cityId));
  if (sameCity) return sameCity;

  if (curated) {
    const sameCategory = pick(unseen.filter((q) => q.category === curated.category));
    if (sameCategory) return sameCategory;
  }

  // Everything has been seen, so the curated question comes round again — which
  // is the right answer once a player has genuinely worked through the bank.
  return curated ?? allQuestions[0];
};
