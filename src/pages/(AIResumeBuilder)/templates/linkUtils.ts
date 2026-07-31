/** Adds an https:// prefix to profile URLs (LinkedIn, GitHub, portfolio, etc.)
 * that are missing a protocol, so they resolve as absolute, clickable links. */
export const normalizeProfileUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
