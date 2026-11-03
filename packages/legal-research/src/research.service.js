"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchService = void 0;
const axios_1 = require("axios");
const cheerio = require("cheerio");
const shared_1 = require("@legal-aid-ai/shared");
const registry_1 = require("./registry");
class ResearchService {
    constructor(registry, config = {}) {
        this.seenUrls = new Set();
        this.lastRequestTime = 0;
        this.registry = registry ?? new registry_1.SourceRegistry();
        this.config = {
            userAgent: config.userAgent ?? 'LegalAidAI-Research/1.0 (+https://github.com/legal-aid-ai)',
            requestDelayMs: config.requestDelayMs ?? 2000,
            timeoutMs: config.timeoutMs ?? 30_000,
            maxRetries: config.maxRetries ?? 3,
        };
        this.httpClient = axios_1.default.create({
            timeout: this.config.timeoutMs,
            headers: {
                'User-Agent': this.config.userAgent,
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'uz,ru;q=0.9,en;q=0.8',
            },
        });
    }
    getRegistry() {
        return this.registry;
    }
    async rateLimit() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.config.requestDelayMs) {
            await (0, shared_1.sleep)(this.config.requestDelayMs - elapsed);
        }
        this.lastRequestTime = Date.now();
    }
    async searchDocuments(query, sourceId) {
        const source = sourceId
            ? this.registry.getSource(sourceId)
            : this.registry.getPrimarySource();
        if (!source) {
            throw new Error(`Manba topilmadi: ${sourceId}`);
        }
        try {
            await this.rateLimit();
            const documents = await (0, shared_1.retry)(() => this.fetchAndParse(source, query), {
                maxRetries: this.config.maxRetries,
                delayMs: 2000,
                onRetry: (error, attempt) => {
                    console.warn(`[ResearchService] Qayta urinish ${attempt}: ${source.name} - ${error.message}`);
                },
            });
            const unique = this.deduplicateDocuments(documents);
            this.registry.updateLastChecked(source.id);
            return {
                documents: unique,
                totalCount: unique.length,
                sourceId: source.id,
                sourceName: source.name,
                retrievedAt: new Date(),
                isVerified: source.type === 'official',
            };
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error(`[ResearchService] ${source.name} dan qidirish xatosi: ${errMsg}`);
            return {
                documents: [],
                totalCount: 0,
                sourceId: source.id,
                sourceName: source.name,
                retrievedAt: new Date(),
                isVerified: false,
            };
        }
    }
    async fetchAndParse(source, query) {
        const searchUrl = this.buildSearchUrl(source, query);
        const response = await this.httpClient.get(searchUrl);
        if (typeof response.data !== 'string') {
            return [];
        }
        const $ = cheerio.load(response.data);
        const documents = [];
        $('a[href]').each((_, element) => {
            const $el = $(element);
            const href = $el.attr('href');
            const text = $el.text().trim();
            if (href && text && this.isLegalDocumentLink(href, source)) {
                const url = href.startsWith('http') ? href : `${source.baseUrl}${href}`;
                documents.push({
                    title: text,
                    url,
                    documentType: this.inferDocumentType(text),
                });
            }
        });
        return documents;
    }
    buildSearchUrl(source, query) {
        const encodedQuery = encodeURIComponent(query);
        switch (source.id) {
            case 'lex-uz':
                return `${source.baseUrl}/search?query=${encodedQuery}`;
            case 'gov-uz':
                return `${source.baseUrl}/oz/search?query=${encodedQuery}`;
            default:
                return `${source.baseUrl}/search?q=${encodedQuery}`;
        }
    }
    isLegalDocumentLink(href, source) {
        const legalPaths = ['/docs/', '/document/', '/law/', '/qaror/', '/farmon/'];
        return legalPaths.some((path) => href.includes(path));
    }
    inferDocumentType(title) {
        const lower = title.toLowerCase();
        if (lower.includes('qonun'))
            return 'Qonun';
        if (lower.includes('qaror'))
            return 'Qaror';
        if (lower.includes('farmon'))
            return 'Farmon';
        if (lower.includes('kodeks'))
            return 'Kodeks';
        if (lower.includes('nizom'))
            return 'Nizom';
        return 'Hujjat';
    }
    deduplicateDocuments(documents) {
        const unique = [];
        for (const doc of documents) {
            if (!this.seenUrls.has(doc.url)) {
                this.seenUrls.add(doc.url);
                unique.push(doc);
            }
        }
        return unique;
    }
    async fetchDocumentContent(url) {
        try {
            await this.rateLimit();
            const response = await (0, shared_1.retry)(() => this.httpClient.get(url), { maxRetries: this.config.maxRetries, delayMs: 2000 });
            if (typeof response.data !== 'string') {
                return null;
            }
            const $ = cheerio.load(response.data);
            $('script, style, nav, footer, header').remove();
            const contentSelectors = [
                '.document-content',
                '.content-body',
                '#content',
                'article',
                'main',
                '.post-content',
            ];
            for (const selector of contentSelectors) {
                const content = $(selector).text().trim();
                if (content.length > 100) {
                    return content;
                }
            }
            return $('body').text().trim() || null;
        }
        catch (error) {
            console.error(`[ResearchService] Hujjat yuklash xatosi (${url}): ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    clearSeenUrls() {
        this.seenUrls.clear();
    }
}
exports.ResearchService = ResearchService;
//# sourceMappingURL=research.service.js.map