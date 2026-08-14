import type { MiniCrosswordPuzzle } from '../../types/puzzle';

/**
 * Grids are 4×4 with two across words and two down words interlocking.
 *
 * Two rules every grid must hold to, both enforced by `questions:check`:
 *
 * 1. **Every filled cell belongs to at least one clue.** A cell no clue reaches
 *    is a square the player is asked to fill with no way of knowing what goes
 *    in it, and the puzzle can never be completed.
 * 2. **Only letters the in-game keyboard actually has.** It offers bare ا, ى,
 *    ة, ء, ئ, ؤ — but no أ, إ or آ. So heritage words are spelled with a bare
 *    alif here (اويا, ادب, ابر), matching how the first grids were written.
 */
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
      { number: 1, direction: 'across', clue: 'حصن يطل على البحر عند مدخل المدينة القديمة', answer: 'سراي', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'سائل ذهبي يُعصر من ثمر الشجرة المباركة', answer: 'زيت', row: 2, col: 1 },
      { number: 1, direction: 'down', clue: 'مكان البيع والشراء في المدينة القديمة', answer: 'سوق', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'أقدم أسماء العاصمة، ومنه بقيت الحكاية', answer: 'اويا', row: 0, col: 2 },
    ],
    funFact: 'المدينة القديمة في العاصمة تجمع أسواقها وأقواسها وقلعتها في مساحة تُقطع مشياً.',
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
      { number: 1, direction: 'across', clue: 'ضد الهزيمة، وغاية كل منافس', answer: 'نصر', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'سفر وسياحة لاستكشاف المعالم والمدن', answer: 'رحلة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'الضياء والسطوع (عكس الظلام)', answer: 'نور', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'حبيبات ذهبية تنتشر على شواطئ وصحراء ليبيا', answer: 'رمل', row: 0, col: 2 },
    ],
    funFact: 'لمدينة بنغازي تاريخ كروي عريق، وجماهيرها من أكثر جماهير البلاد حماسة.',
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
      { number: 1, direction: 'across', clue: 'نبع ماء طبيعي، ومنه شريان حياة غدامس', answer: 'عين', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'إشارة أو علامة ترشد المسافر في الدرب', answer: 'دالة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'آلة موسيقية وترية شرقية أصيلة', answer: 'عود', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'أشجار الواحات المباركة التي تنتج التمور', answer: 'نخل', row: 0, col: 2 },
    ],
    funFact: 'قامت المدينة القديمة حول نبع وُزّعت حصصه بنظام زمني دقيق.',
    rewardDinars: 50,
  },
  {
    id: 'cross_mis_01',
    title: 'البحر والمرافئ',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['م', 'ر', 'س', 'ى'],
      ['ل', null, 'م', null],
      ['ح', 'ا', 'ك', 'م'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'مكان ترسو فيه السفن على الساحل', answer: 'مرسى', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'من يتولى أمر البلاد ويدير شؤونها', answer: 'حاكم', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'يُستخرج من ماء البحر ويُنكَّه به الطعام', answer: 'ملح', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'صيد أهل زوارة ومصراتة من البحر', answer: 'سمك', row: 0, col: 2 },
    ],
    funFact: 'يمتد الساحل الليبي نحو 1,770 كم، وعليه موانئ طرابلس وبنغازي ومصراتة وطبرق ومرافئ صيد صغيرة لا تُحصى.',
    rewardDinars: 50,
  },
  {
    id: 'cross_cyr_01',
    title: 'شحات والجبل الأخضر',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ش', 'ح', 'ا', 'ت'],
      ['م', null, 'ث', null],
      ['س', 'ي', 'ر', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'مدينة الجبل الأخضر القائمة على أطلال قورينا', answer: 'شحات', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'حياة الإنسان ومسيرته كما تُروى وتُكتب', answer: 'سيرة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'قرص النهار الذي يشرق على غابات الجبل', answer: 'شمس', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'ما يبقى من الماضي شاهداً عليه، وجمعه آثار', answer: 'اثر', row: 0, col: 2 },
    ],
    funFact: 'قورينا (شحات) من أعظم المدن الإغريقية في أفريقيا، وتضم معبد أبولو ومسرحاً إغريقياً يطل على السهل.',
    rewardDinars: 50,
  },
  {
    id: 'cross_sab_01',
    title: 'فزان وقوافل الصحراء',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ف', 'ز', 'ا', 'ن'],
      ['ج', null, 'ب', null],
      ['ر', 'م', 'ل', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'إقليم ليبيا الجنوبي وحاضرته سبها', answer: 'فزان', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'كثيب صغير من كثبان الصحراء', answer: 'رملة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'أول ضوء النهار، وأول الصلوات الخمس', answer: 'فجر', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'سفن الصحراء التي حملت قوافل التجارة', answer: 'ابل', row: 0, col: 2 },
    ],
    funFact: 'كانت جرما وما حولها محطات القوافل الكبرى في فزان، ومنها تنطلق الدروب نحو وسط أفريقيا.',
    rewardDinars: 50,
  },
  {
    id: 'cross_jal_01',
    title: 'النخيل والواحات',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ت', 'م', 'و', 'ر'],
      ['ي', null, 'ق', null],
      ['ن', 'ب', 'ت', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'ثمر النخيل الذي تشتهر به جالو وأوجلة', answer: 'تمور', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'شتلة صغيرة تُغرس في الأرض لتكبر', answer: 'نبتة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'فاكهة صيفية تُجفف وتُخزن للشتاء', answer: 'تين', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'ما تقيسه الساعة، وأثمن ما يملكه الإنسان', answer: 'وقت', row: 0, col: 2 },
    ],
    funFact: 'واحات الشرق الليبي من أقدم مراكز زراعة النخيل في شمال أفريقيا.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gry_01',
    title: 'حرف وصناعات تقليدية',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ف', 'خ', 'ا', 'ر'],
      ['ر', null, 'ب', null],
      ['ن', 'و', 'ر', 'س'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'حرفة غريان في تشكيل الطين وحرقه أواني', answer: 'فخار', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'طائر أبيض يحلق فوق موانئ الساحل', answer: 'نورس', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'يُحرق فيه الطين ويُخبز فيه العيش', answer: 'فرن', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'أدوات الخياطة الدقيقة، مفردها إبرة', answer: 'ابر', row: 0, col: 2 },
    ],
    funFact: 'ورش المدينة ما زالت تعمل بالطرق المتوارثة، وأفرانها لا تكاد تنطفئ.',
    rewardDinars: 50,
  },
  {
    id: 'cross_tbk_01',
    title: 'طبرق ودروب الشرق',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ط', 'ب', 'ر', 'ق'],
      ['ر', null, 'ي', null],
      ['ق', 'م', 'ح', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'مدينة شرقية ذات مرفأ طبيعي عميق', answer: 'طبرق', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'حبة من السنبلة يُطحن منها الدقيق', answer: 'قمحة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'مسالك تصل بين المدن، مفردها طريق', answer: 'طرق', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'هواء متحرك قد يحمل معه رمال الصحراء', answer: 'ريح', row: 0, col: 2 },
    ],
    funFact: 'مدينة الشرق الأقصى على الساحل، ومرفؤها من أعمق مرافئ جنوب المتوسط.',
    rewardDinars: 50,
  },
  {
    id: 'cross_lit_01',
    title: 'لغة وأدب وكرم',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ك', 'ت', 'ا', 'ب'],
      ['ر', null, 'د', null],
      ['م', 'ح', 'ب', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'يُقرأ ويُجمع على كتب', answer: 'كتاب', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'مودة بين الناس تجمع القلوب', answer: 'محبة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'خُلق الضيافة الذي يفاخر به أهل ليبيا', answer: 'كرم', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'فنون القول من شعر ونثر', answer: 'ادب', row: 0, col: 2 },
    ],
    funFact: 'الرواية الليبية بلغت العالمية على يد كاتب جعل من الصحراء بطلاً لا خلفية.',
    rewardDinars: 50,
  },

  // ── شبكات المعرفة العامة ───────────────────────────────────────────────────
  // أدلتها عامة لا ليبية، لتوسيع بنك المتقاطعات دون أن تتحول اللعبة إلى مسابقة
  // عامة بقشرة ليبية. كل شبكة مجموعة من أربع كلمات قصيرة حول فكرة واحدة.
  {
    id: 'cross_gen_01',
    title: 'سماء ووطن',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ن', 'ج', 'و', 'م'],
      ['ه', null, 'ط', null],
      ['ر', 'و', 'ن', 'ق'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'أجرام مضيئة تُرى في السماء ليلاً', answer: 'نجوم', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'بهاء الشيء وحسنه', answer: 'رونق', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'مجرى ماء عذب، أطوله في أفريقيا النيل', answer: 'نهر', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'البلد الذي ينتمي إليه الإنسان', answer: 'وطن', row: 0, col: 2 },
    ],
    funFact: 'اهتدى أهل الصحراء بالنجوم في أسفارهم قبل ظهور البوصلة، وكان نجم الشمال دليلهم الثابت في الليل.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_02',
    title: 'الإنسان والمكان',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['د', 'م', 'ا', 'غ'],
      ['ا', null, 'ر', null],
      ['ر', 'و', 'ض', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'مركز التفكير والإدراك في الجسم', answer: 'دماغ', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'بستان غنّاء، وأول مراحل التعليم', answer: 'روضة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'بيت ومسكن، ويقال لها الحوش في ليبيا', answer: 'دار', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'الكوكب الذي نعيش عليه', answer: 'ارض', row: 0, col: 2 },
    ],
    funFact: 'يزن دماغ الإنسان البالغ نحو 1.4 كيلوغرام، ويستهلك وحده خُمس الأكسجين الذي يتنفسه الجسم.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_03',
    title: 'بحر وبَر',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ب', 'ح', 'ا', 'ر'],
      ['ر', null, 'س', null],
      ['د', 'و', 'د', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'مسطحات مائية مالحة واسعة', answer: 'بحار', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'كائن صغير يزحف في التربة ويفيدها', answer: 'دودة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'ضد الحر، ويشتد في شتاء الجبل', answer: 'برد', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'حيوان مفترس يُلقب بملك الغابة', answer: 'اسد', row: 0, col: 2 },
    ],
    funFact: 'تغطي البحار والمحيطات نحو 71% من سطح الأرض، ولا يزال الجزء الأكبر من قاعها غير مستكشف.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_04',
    title: 'ثمار وجبال',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ت', 'ف', 'ا', 'ح'],
      ['ا', null, 'ك', null],
      ['ج', 'ب', 'ل', 'ي'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'فاكهة مشهورة حمراء أو خضراء', answer: 'تفاح', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'منسوب إلى الجبل، كزيت نفوسة', answer: 'جبلي', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'يوضع على رأس الملك علامة الملك', answer: 'تاج', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'الطعام وما يُتناول منه', answer: 'اكل', row: 0, col: 2 },
    ],
    funFact: 'تنتج مرتفعات الجبل الغربي والجبل الأخضر فواكه المناطق المعتدلة كالتفاح والعنب والتين، بخلاف سهول الساحل.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_05',
    title: 'عبادة ومعنى',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ص', 'ل', 'ا', 'ة'],
      ['و', null, 'ذ', null],
      ['م', 'ع', 'ن', 'ى'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'ثاني أركان الإسلام، وهي خمس في اليوم', answer: 'صلاة', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'مدلول الكلمة وما تشير إليه', answer: 'معنى', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'ركن رمضان، إمساك عن الطعام والشراب', answer: 'صوم', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'عضو السمع في الإنسان', answer: 'اذن', row: 0, col: 2 },
    ],
    funFact: 'أركان الإسلام خمسة: الشهادتان والصلاة والزكاة وصوم رمضان وحج البيت لمن استطاع إليه سبيلاً.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_06',
    title: 'لغة وكتابة',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ح', 'ر', 'و', 'ف'],
      ['ك', null, 'ر', null],
      ['م', 'و', 'ق', 'ع'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'مباني الكلمات، وعدتها في العربية ثمانٍ وعشرون', answer: 'حروف', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'مكان الشيء وموضعه', answer: 'موقع', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'قضاء وفصل بين الناس', answer: 'حكم', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'يُكتب عليه، ومنه ما يكسو الشجر', answer: 'ورق', row: 0, col: 2 },
    ],
    funFact: 'من أكثر لغات العالم انتشاراً، وهي رسمية في أكثر من عشرين دولة ومن لغات الأمم المتحدة الست.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_07',
    title: 'ميدان وراية',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['م', 'ل', 'ع', 'ب'],
      ['ط', null, 'ل', null],
      ['ر', 'س', 'م', 'ي'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'ميدان تُقام عليه المباريات', answer: 'ملعب', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'ما كان معتمداً من جهة مسؤولة', answer: 'رسمي', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'ماء ينزل من السحاب', answer: 'مطر', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'راية الدولة، ويُطلق أيضاً على المعرفة', answer: 'علم', row: 0, col: 2 },
    ],
    funFact: 'أكبر ملاعب العاصمة، واحتضن نهائي البطولة الأفريقية التي استضافتها البلاد.',
    rewardDinars: 50,
  },
  {
    id: 'cross_gen_08',
    title: 'زمان ومكان',
    gridSize: { rows: 4, cols: 4 },
    grid: [
      ['ش', 'ه', 'و', 'ر'],
      ['ع', null, 'ل', null],
      ['ب', 'ل', 'د', 'ة'],
      [null, null, null, null],
    ],
    clues: [
      { number: 1, direction: 'across', clue: 'أقسام السنة، وعدتها اثنا عشر', answer: 'شهور', row: 0, col: 0 },
      { number: 2, direction: 'across', clue: 'قرية أو مدينة صغيرة', answer: 'بلدة', row: 2, col: 0 },
      { number: 1, direction: 'down', clue: 'أهل البلد وسكانه', answer: 'شعب', row: 0, col: 0 },
      { number: 3, direction: 'down', clue: 'الابن الصغير', answer: 'ولد', row: 0, col: 2 },
    ],
    funFact: 'السنة الهجرية قمرية ومدتها نحو 354 يوماً، فتتقدم شهورها على السنة الميلادية كل عام.',
    rewardDinars: 50,
  },
];
