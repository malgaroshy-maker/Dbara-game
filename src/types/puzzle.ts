export interface LetterScramblePuzzle {
  id: string;
  cityId?: string;
  category: 'proverb' | 'slang' | 'dish' | 'landmark';
  prompt: string;
  answer: string; // Arabic word or proverb completion
  scrambledLetters: string[];
  hint: string;
  funFact: string;
  rewardDinars: number;
}

export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface MiniCrosswordPuzzle {
  id: string;
  title: string;
  gridSize: { rows: number; cols: number };
  clues: CrosswordClue[];
  grid: (string | null)[][]; // null means black block
  funFact: string;
  rewardDinars: number;
}

export interface DailyChallengeItem {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  type: 'trivia' | 'scramble' | 'blitz';
  questionId?: string;
  scrambleId?: string;
  rewardDinars: number;
  multiplier: number;
}
