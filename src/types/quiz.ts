export type QuizCategory =
  // ليبية
  | 'history'
  | 'dialects'
  | 'sports'
  | 'food_traditions'
  // عامة
  | 'geography'
  | 'islamic'
  | 'literature'
  | 'science'
  | 'general_arab';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface TriviaQuestion {
  id: string;
  category: QuizCategory;
  cityId?: string;
  difficulty: DifficultyLevel;
  question: string;
  options: string[];
  correctIndex: number;
  funFact: string; // "معلومة ع الماشي"
  rewardDinars: number;
  /**
   * Where the claim can be checked — a named authority, work or verse rather
   * than a link, so it stays verifiable offline and does not rot.
   *
   * Expected on every `hard` and `expert` question, and on anything asserting a
   * number, a date or a superlative. `questions:check` reports what is missing.
   * Never write a source you have not actually confirmed: an invented citation
   * is worse than none, because it stops a reviewer from looking.
   */
  source?: string;
  /**
   * Set on claims that could not be confirmed and are waiting on a reviewer who
   * knows the subject locally. Surfaced as its own filter in the review page.
   */
  needsReview?: string;
}

export interface SpeedBlitzQuestion {
  id: string;
  statement: string;
  isCorrect: boolean;
  category: QuizCategory;
  explanation: string;
}
