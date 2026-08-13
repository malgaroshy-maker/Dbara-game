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
      ['و', null, 'و', null],
      ['ر', 'ا', 'ي', 'ة'],
      [null, null, 'ق', null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'نادي كروي بنغازي عريق يلقب بالفحامة', answer: 'نصر', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'العلم أو الشعار الوطني الذي يُرفع عالياً', answer: 'راية', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'الضياء والسطوع (عكس الظلام)', answer: 'نور', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'الاسم القديم لبنغازي في العهد البطلمي', answer: 'برنيق', row: 0, col: 2 },
    ],
    funFact: 'تعد بنغازي عاصمة الثقافة والأدب وتضم ساحة الشجرة والبلدية التاريخية وبحيرات الكيش و23 يوليو.',
    rewardDinars: 50,
  },
];
