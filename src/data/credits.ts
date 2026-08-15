/**
 * Who made the game, and how a player reaches them.
 *
 * Kept in one module so the name and the contact are stated once — they appear
 * in the settings sheet, the report-a-mistake link and anywhere else that needs
 * them, and a number that lives in three files is a number that gets changed in
 * two of them.
 *
 * The contact itself is deliberately NOT in this file. Anything the app links
 * to is readable by anyone who opens the site — a bundler cannot hide it, and
 * the repository being private changes nothing once the site is deployed. So
 * the channel comes from the build environment, and if the build says nothing,
 * the app offers no channel rather than falling back to a personal number.
 */

export const AUTHOR = {
  arabicName: 'محمد الجروشي',
  latinName: 'Mahamed Algaroshy',
} as const;

/**
 * A form or page that collects reports — the safe channel, because it exposes
 * a form and not a person. `{subject}` anywhere in the URL is replaced by the
 * thing being reported, so a prefilled-field form link works:
 *
 *   VITE_REPORT_URL=https://example.com/form?entry.123={subject}
 */
const REPORT_URL = import.meta.env.VITE_REPORT_URL?.trim();

/**
 * A WhatsApp number in the international form `wa.me` expects: no plus sign, no
 * spaces. Publishes a personal phone number to every visitor, so it is the
 * fallback rather than the default, and is set per-build, never committed.
 */
const REPORT_WHATSAPP = import.meta.env.VITE_REPORT_WHATSAPP?.replace(/\D/g, '');

/** Whether any report channel is configured. The UI hides the link when not. */
export const canReport = Boolean(REPORT_URL || REPORT_WHATSAPP);

/**
 * A link that reports a problem, or `undefined` when no channel is configured.
 *
 * `subject` should name the thing being reported — a question id above all.
 * A report that says "one of the food questions was wrong" costs an hour of
 * searching; one that says `food_trad_09` costs a minute.
 */
export const reportLink = (subject?: string): string | undefined => {
  if (REPORT_URL) {
    return REPORT_URL.includes('{subject}')
      ? REPORT_URL.replace('{subject}', encodeURIComponent(subject ?? ''))
      : REPORT_URL;
  }
  if (!REPORT_WHATSAPP) return undefined;

  const body = [
    'السلام عليكم، عندي ملاحظة على لعبة دبارة:',
    subject ? `\nالموضع: ${subject}` : '',
    '\nالملاحظة: ',
  ].join('');
  return `https://wa.me/${REPORT_WHATSAPP}?text=${encodeURIComponent(body)}`;
};
