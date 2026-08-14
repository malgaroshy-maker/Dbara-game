/**
 * Who made the game, and how a player reaches them.
 *
 * Kept in one module so the name and the contact are stated once — they appear
 * in the settings sheet, the report-a-mistake link and anywhere else that needs
 * them, and a number that lives in three files is a number that gets changed in
 * two of them.
 */

export const AUTHOR = {
  arabicName: 'محمد الجروشي',
  latinName: 'Mahamed Algaroshy',
} as const;

/**
 * The number reports arrive on, in the international form `wa.me` expects: no
 * plus sign, no spaces.
 */
const WHATSAPP_NUMBER = '218928211509';

/**
 * A prefilled WhatsApp message reporting a problem.
 *
 * `subject` should name the thing being reported — a question id above all.
 * A report that says "one of the food questions was wrong" costs an hour of
 * searching; one that says `food_trad_09` costs a minute.
 */
export const reportLink = (subject?: string): string => {
  const lines = [
    'السلام عليكم، عندي ملاحظة على لعبة دبارة:',
    subject ? `\nالموضع: ${subject}` : '',
    '\nالملاحظة: ',
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join(''))}`;
};
