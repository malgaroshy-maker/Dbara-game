export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'exploration' | 'trivia' | 'culture' | 'streak';
  requirementText: string;
  rewardDinars: number;
}

export const badgesList: Badge[] = [
  {
    id: 'welcome_badge',
    title: 'أهلاً بك في دبارة',
    description: 'بدأت رحلتك التراثية الأولى لاستكشاف مدن ومعالم ليبيا.',
    icon: '🧭',
    category: 'exploration',
    requirementText: 'تسجيل الدخول الأول في اللعبة',
    rewardDinars: 50,
  },
  {
    id: 'tripoli_master',
    title: 'عمدة طرابلس',
    description: 'أتممت كافة مراحل العاصمة طرابلس بنجاح وحققت النجوم.',
    icon: '🏰',
    category: 'exploration',
    requirementText: 'إنهاء جميع مراحل محطة طرابلس',
    rewardDinars: 100,
  },
  {
    id: 'dialect_expert',
    title: 'خبير اللهجة والأمثال',
    description: 'فهمت المعاني والمفردات والأمثال الشعبية بجدارة.',
    icon: '🗣️',
    category: 'culture',
    requirementText: 'حل 15 سؤالاً أو لغزاً في فئة اللهجات والأمثال',
    rewardDinars: 120,
  },
  {
    id: 'desert_explorer',
    title: 'مستكشف الصحراء وفزان',
    description: 'عبرت واحات غدامس وسبها وجبال أكاكوس الساحرة.',
    icon: '🏜️',
    category: 'exploration',
    requirementText: 'فتح كافة مدن الجنوب والصحراء',
    rewardDinars: 150,
  },
  {
    id: 'sports_fan',
    title: 'عاشق الكورة الليبية',
    description: 'معلوماتك الكروية عن الدوري الليبي والمنتخب لا تُهزم.',
    icon: '⚽',
    category: 'trivia',
    requirementText: 'حل جميع أسئلة الرياضة والكرة',
    rewardDinars: 80,
  },
  {
    id: 'streak_warrior',
    title: 'صاحب الهمة (7 أيام)',
    description: 'حافظت على سلسلة الدخول اليومي لمدة 7 أيام متواصلة.',
    icon: '🔥',
    category: 'streak',
    requirementText: 'الوصول إلى 7 أيام متتالية في الدخول',
    rewardDinars: 200,
  },
  {
    id: 'grand_jahbadh',
    title: 'الجهبذ الأكبر',
    description: 'حققت أكثر من 20 نجمة في خريطة التحدي الليبي.',
    icon: '👑',
    category: 'trivia',
    requirementText: 'جمع 20 نجمة في رحلة المدن',
    rewardDinars: 300,
  },
];
