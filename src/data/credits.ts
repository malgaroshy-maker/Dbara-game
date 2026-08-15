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
 * Default Tally form for Dbara question & game feedback.
 * Can be overridden at build time via VITE_REPORT_URL.
 */
export const DEFAULT_REPORT_URL = 'https://tally.so/r/3yV5yP';

const CONFIGURED_REPORT_URL = import.meta.env.VITE_REPORT_URL?.trim();
const REPORT_WHATSAPP = import.meta.env.VITE_REPORT_WHATSAPP?.replace(/\D/g, '');

/** Whether reporting channel is enabled. In-app modal is always available. */
export const canReport = true;

/**
 * Returns a configured report URL with interpolated parameters.
 */
export const getReportUrl = (subject?: string, text?: string): string => {
  if (REPORT_WHATSAPP && !CONFIGURED_REPORT_URL) {
    const body = [
      'السلام عليكم، عندي ملاحظة على لعبة دبارة:',
      subject ? `\nالموضع: ${subject}` : '',
      text ? `\nالنص: ${text}` : '',
      '\nالملاحظة: ',
    ].join('');
    return `https://wa.me/${REPORT_WHATSAPP}?text=${encodeURIComponent(body)}`;
  }

  const base = CONFIGURED_REPORT_URL || DEFAULT_REPORT_URL;
  let url = base;

  if (url.includes('{subject}')) {
    url = url.replace('{subject}', encodeURIComponent(subject ?? ''));
  } else if (subject && !url.includes('question_id=')) {
    url += (url.includes('?') ? '&' : '?') + `question_id=${encodeURIComponent(subject)}`;
  }

  if (url.includes('{text}')) {
    url = url.replace('{text}', encodeURIComponent(text ?? ''));
  }

  return url;
};

/**
 * Backward-compatible helper for legacy direct links.
 */
export const reportLink = (subject?: string): string => {
  return getReportUrl(subject);
};

