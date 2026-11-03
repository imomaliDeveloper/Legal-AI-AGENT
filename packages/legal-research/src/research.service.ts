import axios, { AxiosInstance, AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { sleep, retry } from '@legal-aid-ai/shared';
import { SourceRegistry, type LegalSource } from './registry';
import type { LegalDocumentMetadata, LegalSearchResult } from './types';

export interface ResearchServiceConfig {
  userAgent?: string;
  requestDelayMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export class ResearchService {
  private readonly registry: SourceRegistry;
  private readonly httpClient: AxiosInstance;
  private readonly config: Required<ResearchServiceConfig>;
  private readonly seenUrls: Set<string> = new Set();
  private lastRequestTime = 0;

  constructor(
    registry?: SourceRegistry,
    config: ResearchServiceConfig = {},
  ) {
    this.registry = registry ?? new SourceRegistry();
    this.config = {
      userAgent: config.userAgent ?? 'LegalAidAI-Research/1.0 (+https://github.com/legal-aid-ai)',
      requestDelayMs: config.requestDelayMs ?? 2000,
      timeoutMs: config.timeoutMs ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
    };

    this.httpClient = axios.create({
      timeout: this.config.timeoutMs,
      headers: {
        'User-Agent': this.config.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uz,ru;q=0.9,en;q=0.8',
      },
    });
  }

  getRegistry(): SourceRegistry {
    return this.registry;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.config.requestDelayMs) {
      await sleep(this.config.requestDelayMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  async searchDocuments(
    query: string,
    sourceId?: string,
  ): Promise<LegalSearchResult> {
    const source = sourceId
      ? this.registry.getSource(sourceId)
      : this.registry.getPrimarySource();

    if (!source) {
      throw new Error(`Manba topilmadi: ${sourceId}`);
    }

    try {
      await this.rateLimit();

      const documents = await retry(
        () => this.fetchAndParse(source, query),
        {
          maxRetries: this.config.maxRetries,
          delayMs: 2000,
          onRetry: (error, attempt) => {
            console.warn(
              `[ResearchService] Qayta urinish ${attempt}: ${source.name} - ${error.message}`,
            );
          },
        },
      );

      // Deduplicate
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
    } catch (error) {
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

  private async fetchAndParse(
    source: LegalSource,
    query: string,
  ): Promise<LegalDocumentMetadata[]> {
    const searchUrl = this.buildSearchUrl(source, query);

    const response = await this.httpClient.get(searchUrl);

    if (typeof response.data !== 'string') {
      return [];
    }

    const $ = cheerio.load(response.data);
    const documents: LegalDocumentMetadata[] = [];

    // Generic parsing — specific parsers can be added per source
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

  private buildSearchUrl(source: LegalSource, query: string): string {
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

  private isLegalDocumentLink(href: string, source: LegalSource): boolean {
    const legalPaths = ['/docs/', '/document/', '/law/', '/qaror/', '/farmon/'];
    return legalPaths.some((path) => href.includes(path));
  }

  private inferDocumentType(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('qonun')) return 'Qonun';
    if (lower.includes('qaror')) return 'Qaror';
    if (lower.includes('farmon')) return 'Farmon';
    if (lower.includes('kodeks')) return 'Kodeks';
    if (lower.includes('nizom')) return 'Nizom';
    return 'Hujjat';
  }

  private deduplicateDocuments(
    documents: LegalDocumentMetadata[],
  ): LegalDocumentMetadata[] {
    const unique: LegalDocumentMetadata[] = [];

    for (const doc of documents) {
      if (!this.seenUrls.has(doc.url)) {
        this.seenUrls.add(doc.url);
        unique.push(doc);
      }
    }

    return unique;
  }

  async fetchDocumentContent(url: string): Promise<string | null> {
    try {
      await this.rateLimit();

      const response = await retry(
        () => this.httpClient.get(url),
        { maxRetries: this.config.maxRetries, delayMs: 2000 },
      );

      if (typeof response.data !== 'string') {
        return null;
      }

      const $ = cheerio.load(response.data);

      // Remove scripts, styles, nav
      $('script, style, nav, footer, header').remove();

      // Try common content selectors
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
    } catch (error) {
      console.error(
        `[ResearchService] Hujjat yuklash xatosi (${url}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  clearSeenUrls(): void {
    this.seenUrls.clear();
  }
}
