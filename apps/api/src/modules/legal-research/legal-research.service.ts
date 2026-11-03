import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SourceRegistry, ResearchService, LegalSource } from '@legal-aid-ai/legal-research';

@Injectable()
export class LegalResearchService {
  private readonly logger = new Logger(LegalResearchService.name);
  private registry: SourceRegistry;
  private researchService: ResearchService;

  constructor(private prisma: PrismaService) {
    this.registry = new SourceRegistry();
    this.researchService = new ResearchService(this.registry, {
      timeoutMs: 15000,
      maxRetries: 3,
    });
    this.syncSourcesFromDb();
  }

  async syncSourcesFromDb() {
    try {
      const dbSources = await this.prisma.legalSource.findMany({
        where: { isActive: true },
      });

      if (dbSources.length === 0) {
        // Seed default lex.uz
        await this.prisma.legalSource.upsert({
          where: { baseUrl: 'https://lex.uz' },
          update: {},
          create: {
            name: 'Lex.uz - O‘zbekiston Respublikasi Qonun hujjatlari ma’lumotlari milliy bazasi',
            baseUrl: 'https://lex.uz',
            type: 'OFFICIAL',
            priority: 1,
            description: 'Rasmiy qonunchilik milliy bazasi',
          },
        });
      }

      const allSources = await this.prisma.legalSource.findMany();
      for (const s of allSources) {
        this.registry.addSource({
          id: s.id,
          name: s.name,
          baseUrl: s.baseUrl,
          type: s.type.toLowerCase() as any,
          isActive: s.isActive,
          priority: s.priority,
        });
      }
      this.logger.log(`Qonunchilik manbalari sinxronlandi: ${allSources.length} ta manba`);
    } catch (err) {
      this.logger.warn(`Qonun manbalarini sinxronlashda xatolik: ${err.message}`);
    }
  }

  async getSources() {
    return this.prisma.legalSource.findMany({
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { priority: 'asc' },
    });
  }

  async addSource(data: { name: string; baseUrl: string; type: any; priority?: number; description?: string }) {
    const source = await this.prisma.legalSource.create({
      data: {
        name: data.name,
        baseUrl: data.baseUrl,
        type: data.type,
        priority: data.priority || 0,
        description: data.description,
      },
    });

    this.registry.addSource({
      id: source.id,
      name: source.name,
      baseUrl: source.baseUrl,
      type: source.type.toLowerCase() as any,
      isActive: source.isActive,
      priority: source.priority,
    });

    return source;
  }

  async searchDocuments(query: string) {
    // 1. Search in cached/saved database documents
    const dbDocs = await this.prisma.legalDocument.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { documentNumber: { contains: query, mode: 'insensitive' } },
          { fullText: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { source: true },
      take: 20,
      orderBy: { publicationDate: 'desc' },
    });

    return {
      results: dbDocs,
      total: dbDocs.length,
      query,
    };
  }

  async discoverNewDocuments() {
    this.logger.log('Yangi qonun hujjatlarini qidirish boshlandi (Lex.uz)...');
    const primarySource = await this.prisma.legalSource.findFirst({
      where: { baseUrl: 'https://lex.uz', isActive: true },
    });

    if (!primarySource) {
      this.logger.warn('Lex.uz manbasi bazada topilmadi');
      return { discovered: 0 };
    }

    try {
      const searchResult = await this.researchService.searchDocuments('yangi qaror', primarySource.id);
      let discoveredCount = 0;

      for (const doc of searchResult.documents) {
        if (!doc.url) continue;

        const existing = await this.prisma.legalDocument.findUnique({
          where: { officialUrl: doc.url },
        });

        if (!existing) {
          await this.prisma.legalDocument.create({
            data: {
              title: doc.title || 'Noma\'lum huquqiy hujjat',
              documentNumber: doc.documentNumber,
              documentType: doc.documentType || 'Qaror',
              publicationDate: doc.publicationDate,
              effectiveDate: doc.effectiveDate,
              officialUrl: doc.url,
              status: 'ACTIVE',
              changeType: 'NEW',
              summary: doc.title,
              fullText: doc.title,
              isVerified: true,
              verifiedAt: new Date(),
              sourceId: primarySource.id,
            },
          });
          discoveredCount++;
        }
      }

      await this.prisma.legalSource.update({
        where: { id: primarySource.id },
        data: { lastChecked: new Date() },
      });

      this.logger.log(`Yangi hujjatlar topildi va saqlandi: ${discoveredCount} ta`);
      return { discovered: discoveredCount };
    } catch (err) {
      this.logger.error(`Qonun hujjatlarini aniqlashda xato: ${err.message}`);
      return { discovered: 0, error: err.message };
    }
  }

  async verifyDocument(id: string, notes?: string) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Hujjat topilmadi');

    return this.prisma.legalDocument.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }
}
