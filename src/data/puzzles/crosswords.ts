import type { MiniCrosswordPuzzle } from '../../types/puzzle';

export const miniCrosswords: MiniCrosswordPuzzle[] = [
  {
    id: 'cross_trp_01',
    title: 'معالم وأعلام طرابلس',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['س', 'ر', 'ا', 'ي'],
      ['و', null, 'و', null],
      ['ق', 'ز', 'ي', 'ت'],
      [null, null, 'ا', null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'اسم قلعة طرابلس التاريخية الشهيرة', answer: 'سراي', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'سائل ذهبي تشتهر به مزارع الزيتون', answer: 'زيت', row: 2, col: 1 },
      { number: 1, direction: 'down', clue: 'مكان البيع والشراء في المدينة القديمة', answer: 'سوق', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'الاسم الفينيقي القديم لمدينة طرابلس', answer: 'اويا', row: 0, col: 2 },
    ],
    funFact: 'تتميز المدينة القديمة في طرابلس بالسرايا الحمراء وأسواق الصاغة وباب الحرية ومعالم تاريخية تمتد لآلاف السنين.',
    rewardDinars: 50,
  },
  {
    id: 'cross_ben_01',
    title: 'تراث ورياضة بنغازي',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ن', 'ص', 'ر', null],
      ['و', null, 'م', null],
      ['ر', 'ح', 'ل', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'نادي كروي بنغازي عريق يلقب بالفحامة', answer: 'نصر', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'سفر وسياحة لاستكشاف المعالم والمدن', answer: 'رحلة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'الضياء والسطوع (عكس الظلام)', answer: 'نور', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'حبيبات ذهبية تنتشر على شواطئ وصحراء ليبيا', answer: 'رمل', row: 0, col: 2 },
    ],
    funFact: 'تعد بنغازي عاصمة الثقافة والأدب وتضم ساحة الشجرة والبلدية التاريخية وبحيرات الكيش و23 يوليو.',
    rewardDinars: 50,
  },
  {
    id: 'cross_ghad_01',
    title: 'واحات الصحراء وغدامس',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ع', 'ي', 'ن', null],
      ['و', null, 'خ', null],
      ['د', 'ا', 'ل', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'نبع مائي مثل عين الفرس شريان الحياة', answer: 'عين', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'إشارة أو علامة ترشد المسافر في الدرب', answer: 'دالة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'آلة موسيقية وترية شرقية أصيلة', answer: 'عود', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'أشجار الواحات المباركة التي تنتج التمور', answer: 'نخل', row: 0, col: 2 },
    ],
    funFact: 'تعتبر مدينة غدامس لؤلؤة الصحراء بعين مائها ونظام توزيع السواقي الهندسي الفريد.',
    rewardDinars: 50,
  },
];
