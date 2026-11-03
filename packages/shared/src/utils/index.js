"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUzbekDate = formatUzbekDate;
exports.sanitizeHtml = sanitizeHtml;
exports.truncateText = truncateText;
exports.generateSlug = generateSlug;
exports.sleep = sleep;
exports.retry = retry;
const constants_1 = require("../constants");
function formatUzbekDate(date) {
    const months = [
        'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
        'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
    ];
    const tashkentDate = new Date(date.toLocaleString('en-US', { timeZone: constants_1.DEFAULT_TIMEZONE }));
    const day = tashkentDate.getDate();
    const month = months[tashkentDate.getMonth()];
    const year = tashkentDate.getFullYear();
    return `${day}-${month}, ${year}-yil`;
}
function sanitizeHtml(html) {
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
function truncateText(text, maxLength, suffix = '...') {
    if (text.length <= maxLength)
        return text;
    const truncated = text.slice(0, maxLength - suffix.length);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.5) {
        return truncated.slice(0, lastSpace) + suffix;
    }
    return truncated + suffix;
}
function generateSlug(text) {
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
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retry(fn, options = {}) {
    const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2, onRetry, } = options;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
//# sourceMappingURL=index.js.map