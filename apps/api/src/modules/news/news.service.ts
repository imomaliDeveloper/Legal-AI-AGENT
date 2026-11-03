import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { generateSlug } from '@legal-aid-ai/shared';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
  ) {}

  async generateNewsPost(data: {
    documentId?: string;
    topic?: string;
    rawContent?: string;
    userId?: string;
  }) {
    let contextText = '';
    let sourceUrl = 'https://lex.uz';
    let documentNumber = '';
    let effectiveDateStr = '';

    if (data.documentId) {
      const doc = await this.prisma.legalDocument.findUnique({
        where: { id: data.documentId },
        include: { source: true },
      });
      if (doc) {
        contextText = `Hujjat nomi: ${doc.title}\nRaqami: ${doc.documentNumber || 'Mavjud emas'}\nQabul qilingan sana: ${doc.publicationDate || ''}\nKuchga kirish sanasi: ${doc.effectiveDate || ''}\nRasmiy havola: ${doc.officialUrl}\nMatn: ${doc.summary || doc.fullText || ''}`;
        sourceUrl = doc.officialUrl || sourceUrl;
        documentNumber = doc.documentNumber || '';
        effectiveDateStr = doc.effectiveDate ? doc.effectiveDate.toISOString().split('T')[0] : '';
      }
    } else if (data.rawContent) {
      contextText = data.rawContent;
    } else if (data.topic) {
      contextText = `Mavzu: ${data.topic}`;
    } else {
      throw new BadRequestException('documentId, rawContent yoki topic kiritilishi shart');
    }

    const systemPrompt = `Siz O‘zbekiston qonunchiligi bo‘yicha professional yurist va "LEGAL AID AI" loyihasining Huquqiy Yangiliklar Agentisiz.
Qat'iy qoidalar:
1. Matnni faqat O‘zbek tilida (Lotin alifbosida) tuzing.
2. Qonun, modda yoki hujjat raqamini aslo to‘qimang. Faqat berilgan aniq ma'lumotlarga tayanib yozing.
3. Agar manba to‘liq tasdiqlanmagan bo‘lsa, buni ochiq bildiring.
4. Telegram kanali (@Huquq_study) uchun qulay, o‘qilishi oson va rasmiy uslubda bo‘lsin.
5. Quyidagi formatda javob bering:
---
SARLAVHA: [Qisqa va e'tiborni tortuvchi sarlavha]
QISQA KIRISH: [1-2 gap]
NIMA O‘ZGARDI?: [Asosiy o‘zgarishlar bandlar bilan]
KIMLARGA TA'SIR QILADI?: [Fuqarolar, tadbirkorlar va h.k.]
KUCHGA KIRISH SANASI: [Aniq sana yoki e'lon qilingan kundan]
HUQUQIY AHAMIYATI: [Qisqa tahlil]
RASMIY ASOS: [Qonun/Qaror raqami va sanasi]
MANBA: [Havola]`;

    const prompt = `Quyidagi huquqiy ma'lumotlar asosida Telegram kanali uchun rasmiy yangilik posti tayyorlang:\n\n${contextText}`;

    const aiResult = await this.aiProvider.generate('legal_news_generation', prompt, systemPrompt);

    // Parse title
    const lines = aiResult.content.split('\n');
    let title = 'Yangi qonunchilik hujjati qabul qilindi';
    const titleLine = lines.find((l) => l.startsWith('SARLAVHA:'));
    if (titleLine) {
      title = titleLine.replace('SARLAVHA:', '').trim();
    } else if (lines[0]) {
      title = lines[0].replace(/^[#*\s]+/, '').trim().slice(0, 150);
    }

    const slug = `${generateSlug(title)}-${Date.now()}`;

    // Create post in database as DRAFT (SEMI-AUTONOMOUS workflow)
    const post = await this.prisma.post.create({
      data: {
        title,
        slug,
        content: aiResult.content,
        summary: lines.find((l) => l.startsWith('QISQA KIRISH:'))?.replace('QISQA KIRISH:', '').trim() || null,
        type: 'NEWS',
        status: 'DRAFT',
        legalDomain: 'GENERAL',
        isVerified: !!data.documentId,
        verificationStatus: data.documentId ? 'VERIFIED' : 'UNVERIFIED',
        authorId: data.userId || null,
        originalContent: aiResult.content,
        legalReferences: {
          create: [
            {
              citationText: documentNumber ? `Hujjat: ${documentNumber}` : 'O‘zbekiston Respublikasi Qonunchiligi',
              officialUrl: sourceUrl,
              isVerified: true,
            },
          ],
        },
      },
      include: {
        legalReferences: true,
      },
    });

    this.logger.log(`Yangi huquqiy yangilik qoralamasi yaratildi (ID: ${post.id})`);
    return post;
  }

  async getAllNews(status?: any) {
    return this.prisma.post.findMany({
      where: {
        type: 'NEWS',
        ...(status && { status }),
      },
      include: {
        legalReferences: true,
        author: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
