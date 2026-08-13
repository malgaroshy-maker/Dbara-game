import type { DailyChallengeItem } from '../../types/puzzle';

export const dailyChallenges: DailyChallengeItem[] = [
  {
    date: '2026-08-13',
    title: 'تحدي اليوم: أمثال وأكلات ليبية',
    description: 'أجب عن لغز اليوم الثقافي واحصل على دنانير مضاعفة وسلسلة أيام متتالية!',
    type: 'trivia',
    questionId: 'dia_03',
    rewardDinars: 75,
    multiplier: 2,
  },
  {
    date: '2026-08-14',
    title: 'تحدي اليوم: لؤلؤة الصحراء',
    description: 'لغز ترتيب حروف من تراث مدينة غدامس وعين الفرس!',
    type: 'scramble',
    scrambleId: 'scramble_ghad_01',
    rewardDinars: 100,
    multiplier: 2.5,
  },
  {
    date: '2026-08-15',
    title: 'تحدي اليوم: سباق الزمن الرياضي',
    description: 'اختبر سرعتك في معلومات كرة القدم الليبية والتاريخ الوطني!',
    type: 'blitz',
    rewardDinars: 120,
    multiplier: 3,
  },
];
