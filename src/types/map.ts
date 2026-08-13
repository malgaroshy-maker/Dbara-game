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
  /**
   * Real-world coordinates in decimal degrees. The map projects these onto the
   * artwork (see `features/map/projection.ts`) rather than storing screen
   * percentages, so a pin can be checked against an atlas.
   */
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /**
   * Short name for the map pin. Real coordinates put the coastal cities very
   * close together, so the map uses a terse label and the detail card carries
   * the full `arabicName`. Falls back to `arabicName`.
   */
  mapLabel?: string;
  /**
   * Hand-placed label offset from the pin, in artwork pixels, the way a
   * cartographer nudges colliding labels apart. Defaults to below the pin.
   */
  labelOffset?: { x: number; y: number };
  stagesCount: number;
  unlockedByDefault?: boolean;
  requiredStarsToUnlock: number;
  stages: Stage[];
}
