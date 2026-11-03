/** Telegram API rate limit: messages per second per chat */
export const TELEGRAM_RATE_LIMIT = 30;

/** Default timezone for O'zbekiston */
export const DEFAULT_TIMEZONE = 'Asia/Tashkent';

/** Maximum Telegram message length */
export const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

/** Supported image formats for content */
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/** Default daily publication schedule (hours in Asia/Tashkent timezone) */
export const DEFAULT_SCHEDULE = {
  news: { hour: 8, minute: 0, label: 'Yangiliklar' },
  education: { hour: 12, minute: 0, label: 'Ta\'limiy maqola' },
  caseStudy: { hour: 16, minute: 0, label: 'Amaliy vaziyat' },
  quiz: { hour: 19, minute: 0, label: 'Viktorina' },
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/** AI generation defaults */
export const AI_DEFAULTS = {
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  TIMEOUT_MS: 60_000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

/** Legal source check interval in milliseconds (1 hour) */
export const LEGAL_SOURCE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
