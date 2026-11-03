import { DEFAULT_TIMEZONE } from '../constants';

/**
 * Formats a Date object to Uzbek (Latin) locale string.
 * Example: "3-noyabr, 2026-yil"
 */
export function formatUzbekDate(date: Date): string {
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
  ];

  const tashkentDate = new Date(
    date.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }),
  );

  const day = tashkentDate.getDate();
  const month = months[tashkentDate.getMonth()];
  const year = tashkentDate.getFullYear();

  return `${day}-${month}, ${year}-yil`;
}

/**
 * Basic HTML sanitization — strips all tags.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Truncates text to a maximum length, adding an ellipsis if truncated.
 * Respects word boundaries.
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}

/**
 * Generates a URL-safe slug from a string.
 * Handles Uzbek Latin characters.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[oʻ]/g, 'o')
    .replace(/[gʻ]/g, 'g')
    .replace(/[''ʼ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/**
 * Promise-based sleep utility.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(backoffMultiplier, attempt);
        onRetry?.(lastError, attempt + 1);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
}
