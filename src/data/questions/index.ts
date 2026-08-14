import type { TriviaQuestion } from '../../types/quiz';
import { historyQuestions } from './history';
import { dialectQuestions } from './dialects';
import { sportsQuestions } from './sports';
import { foodTraditionsQuestions } from './foodTraditions';
import { generalArabQuestions } from './generalArab';
import { geographyQuestions } from './geography';
import { islamicQuestions } from './islamic';
import { literatureQuestions } from './literature';
import { scienceQuestions } from './science';

/**
 * Every multiple-choice question in one place, in a stable order.
 *
 * The order matters: the daily challenge walks this array by index, so
 * inserting a question in the middle of a bank shifts which question a given
 * date lands on. That is acceptable (the schedule is not a promise), but
 * appending is the friendlier way to grow a bank.
 */
export const allQuestions: TriviaQuestion[] = [
  ...historyQuestions,
  ...dialectQuestions,
  ...sportsQuestions,
  ...foodTraditionsQuestions,
  ...generalArabQuestions,
  ...geographyQuestions,
  ...islamicQuestions,
  ...literatureQuestions,
  ...scienceQuestions,
];

const byId = new Map(allQuestions.map((q) => [q.id, q]));

/** Resolves a question id from any bank — not just the one a screen imports. */
export const questionById = (id: string): TriviaQuestion | undefined => byId.get(id);
