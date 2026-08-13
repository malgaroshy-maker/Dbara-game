export type LibyanRegion = 'tripolitania' | 'cyrenaica' | 'fezzan' | 'oasis_desert';

export interface Stage {
  id: string;
  stageNumber: number;
  title: string;
  type: 'multiple_choice' | 'speed_blitz' | 'letter_scramble' | 'crossword';
  questionId?: string;
  puzzleId?: string;
  starsEarned: number; // 0, 1, 2, 3
  isUnlocked: boolean;
  rewardDinars: number;
}

export interface CityNode {
  id: string;
  name: string;
  arabicName: string;
  titleBadge: string; // e.g. "عروس البحر", "لؤلؤة الصحراء"
  region: LibyanRegion;
  description: string;
  historicalLore: string;
  icon: string;
  coordinates: {
    xPercent: number; // 0-100 on Libya Map SVG
    yPercent: number; // 0-100 on Libya Map SVG
  };
  stagesCount: number;
  unlockedByDefault?: boolean;
  requiredStarsToUnlock: number;
  stages: Stage[];
}
