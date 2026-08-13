export interface LetterScramblePuzzle {
  id: string;
  cityId?: string;
  category: 'proverb' | 'slang' | 'dish' | 'landmark' | 'sports';
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
  /**
   * What clearing the challenge pays, and the only source of truth for it —
   * the screen that runs the challenge awards exactly this. There used to be a
   * separate `multiplier` that the UI advertised ("مكافأة x2") but nothing
   * ever applied, so the card promised 75 and paid 30.
   */
  rewardDinars: number;
}
