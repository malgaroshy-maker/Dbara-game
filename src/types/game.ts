export type GameMode = 'map' | 'quickplay' | 'daily' | 'speed' | 'badges' | 'shop';

export interface PlayerProfile {
  name: string;
  avatar: string;
  title: string;
  dinars: number;
  totalStars: number;
  streakDays: number;
  lastLoginDate: string;
  lifelines: {
    fiftyFifty: number;
    revealLetter: number;
    skip: number;
    extraTime: number;
  };
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface GameStats {
  questionsAnswered: number;
  correctAnswers: number;
  citiesUnlocked: number;
  crosswordsSolved: number;
  dailyStreakRecord: number;
  bestSpeedScore: number;
}
