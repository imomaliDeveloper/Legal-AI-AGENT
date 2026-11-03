import { SourceRegistry } from './registry';
import type { LegalSearchResult } from './types';
export interface ResearchServiceConfig {
    userAgent?: string;
    requestDelayMs?: number;
    timeoutMs?: number;
    maxRetries?: number;
}
export declare class ResearchService {
    private readonly registry;
    private readonly httpClient;
    private readonly config;
    private readonly seenUrls;
    private lastRequestTime;
    constructor(registry?: SourceRegistry, config?: ResearchServiceConfig);
    getRegistry(): SourceRegistry;
    private rateLimit;
    searchDocuments(query: string, sourceId?: string): Promise<LegalSearchResult>;
    private fetchAndParse;
    private buildSearchUrl;
    private isLegalDocumentLink;
    private inferDocumentType;
    private deduplicateDocuments;
    fetchDocumentContent(url: string): Promise<string | null>;
    clearSeenUrls(): void;
}
