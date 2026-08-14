/**
 * What dinars are actually for.
 *
 * The game paid out far more than it could ever take back — a perfect round was
 * worth over 250 against lifelines costing 15 to 40 — so the balance climbed
 * forever and the reward stopped meaning anything. Cosmetics are the sink that
 * cannot unbalance the game: they change nothing about difficulty, so they can
 * be priced as high as they need to be.
 *
 * Prices are set against a perfect five-question round, which now pays about
 * 120 dinars: a cheap avatar is a couple of good rounds, the ranked titles are
 * a week of play.
 */

export interface Cosmetic {
  id: string;
  /** The emoji worn as the player's avatar, or the title text. */
  value: string;
  label: string;
  cost: number;
}

export const AVATARS: Cosmetic[] = [
  { id: 'av_camel', value: '🐫', label: 'جمل الصحراء', cost: 250 },
  { id: 'av_palm', value: '🌴', label: 'نخلة الواحة', cost: 250 },
  { id: 'av_teapot', value: '🫖', label: 'براد الشاي', cost: 400 },
  { id: 'av_amphora', value: '🏺', label: 'فخار غريان', cost: 400 },
  { id: 'av_lighthouse', value: '🗼', label: 'منارة الساحل', cost: 600 },
  { id: 'av_horse', value: '🐎', label: 'فرس المتوسط', cost: 600 },
  { id: 'av_falcon', value: '🦅', label: 'صقر الجبل', cost: 900 },
  { id: 'av_star', value: '🌟', label: 'نجمة الجنوب', cost: 1200 },
];

export const TITLES: Cosmetic[] = [
  { id: 'ti_guide', value: 'دليل القوافل', label: 'دليل القوافل', cost: 500 },
  { id: 'ti_sailor', value: 'بحّار المتوسط', label: 'بحّار المتوسط', cost: 700 },
  { id: 'ti_keeper', value: 'حارس التراث', label: 'حارس التراث', cost: 1000 },
  { id: 'ti_sage', value: 'جهبذ ليبيا', label: 'جهبذ ليبيا', cost: 1800 },
];

/**
 * What it costs to open a city without the stars.
 *
 * Priced off the stars it would otherwise take, so skipping ahead to the far
 * south costs real money rather than being a flat fee that trivialises the map.
 */
export const cityUnlockCost = (requiredStars: number): number =>
  Math.max(200, requiredStars * 120);
