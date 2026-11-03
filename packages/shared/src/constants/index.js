"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_SOURCE_CHECK_INTERVAL_MS = exports.AI_DEFAULTS = exports.PAGINATION = exports.DEFAULT_SCHEDULE = exports.SUPPORTED_IMAGE_FORMATS = exports.MAX_TELEGRAM_MESSAGE_LENGTH = exports.DEFAULT_TIMEZONE = exports.TELEGRAM_RATE_LIMIT = void 0;
exports.TELEGRAM_RATE_LIMIT = 30;
exports.DEFAULT_TIMEZONE = 'Asia/Tashkent';
exports.MAX_TELEGRAM_MESSAGE_LENGTH = 4096;
exports.SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
exports.DEFAULT_SCHEDULE = {
    news: { hour: 8, minute: 0, label: 'Yangiliklar' },
    education: { hour: 12, minute: 0, label: 'Ta\'limiy maqola' },
    caseStudy: { hour: 16, minute: 0, label: 'Amaliy vaziyat' },
    quiz: { hour: 19, minute: 0, label: 'Viktorina' },
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};
exports.AI_DEFAULTS = {
    MAX_TOKENS: 4096,
    TEMPERATURE: 0.7,
    TIMEOUT_MS: 60_000,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
};
exports.LEGAL_SOURCE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
//# sourceMappingURL=index.js.map