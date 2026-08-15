/**
 * The standard 3-row Arabic crossword keyboard layout and canonical character set.
 *
 * Symmetrical 11-keys-per-row layout (33 letters). Note the deliberate absence
 * of isolated ligatures and variant hamzas (أ إ آ) — grid clues use unhamzated
 * 'ا' and standard forms so players have a clean, predictable typing experience.
 */
export const CROSSWORD_KEYBOARD_ROWS: string[][] = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'د', 'ذ'],
];

export const CROSSWORD_KEYBOARD_LETTERS: string[] = CROSSWORD_KEYBOARD_ROWS.flat();

export const CROSSWORD_KEYBOARD_SET: Set<string> = new Set(CROSSWORD_KEYBOARD_LETTERS);
