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
}

export interface SpeedBlitzQuestion {
  id: string;
  statement: string;
  isCorrect: boolean;
  category: QuizCategory;
  explanation: string;
}
