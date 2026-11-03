import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { generateSlug } from '@legal-aid-ai/shared';

@Injectable()
export class EducationalContentService {
  private readonly logger = new Logger(EducationalContentService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
  ) {}

  async generateArticle(data: {
    legalDomain: any;
    topic: string;
    difficulty?: any;
    userId?: string;
  }) {
    const domainTranslations: Record<string, string> = {
      CONSTITUTIONAL: 'Konstitutsiyaviy huquq',
      CIVIL: 'Fuqarolik huquqi',
      CRIMINAL: 'Jinoyat huquqi',
      ADMINISTRATIVE: 'Ma\'muriy huquq',
      LABOR: 'Mehnat huquqi',
      FAMILY: 'Oila huquqi',
      TAX: 'Soliq huquqi',
      BUSINESS: 'Biznes va tadbirkorlik huquqi',
      HUMAN_RIGHTS: 'Inson huquqlari',
      GENERAL: 'Umumiy huquq',
    };

    const domainName = domainTranslations[data.legalDomain] || data.legalDomain;

    const systemPrompt = `Siz O‘zbekiston huquq tizimi bo‘yicha tajribali huquqshunos-pedagog va "LEGAL AID AI" loyihasining Ta'limiy Maqolalar Agentisiz.
Qat'iy talablar:
1. Matnni faqat O‘zbek tilida (Lotin alifbosida), yangi boshlovchilar va oddiy fuqarolar tushunadigan sodda va qiziqarli tilda yozing.
2. Huquqiy atamalarni amaliy misollar bilan izohlang.
3. Asos sifatida O‘zbekiston Respublikasi amaldagi qonunchiligining (Konstitutsiya, Fuqarolik kodeksi, Mehnat kodeksi, Oila kodeksi va b.) aniq moddalariga havola bering. Aslo mavjud bo'lmagan moddalarni to'qimang!
4. Maqola tuzilishi aniq quyidagicha bo'lsin:
---
SARLAVHA: [Aniq va tushunarli sarlavha]
SOHA: ${domainName}
KIRISH VA HUQUQIY TUSHUNCHA: [Mavzuning mohiyati sodda tilda]
QONUNCHILIK ASOSI: [O‘zbekiston Respublikasining amaldagi qonunlari va moddalari]
AMALIY HAYOTIY MISOLLAR: [Hayotdan olingan 1-2 ta tushunarli keys/misol]
FOYDALI MASLAHATLAR / XULOSA: [Fuqaro o‘z huquqini qanday himoya qilishi mumkin?]
RASMIY MANBALAR: [Lex.uz havolasi yoki normativ hujjat nomi]`;

    const prompt = `Mavzu: "${data.topic}" bo‘yicha ${domainName} sohasida keng qamrovli, tushunarli ta'limiy maqola tayyorlang.`;

    const aiResult = await this.aiProvider.generate('educational_article_generation', prompt, systemPrompt);

    const lines = aiResult.content.split('\n');
    let title = `${data.topic} bo‘yicha huquqiy qo‘llanma`;
    const titleLine = lines.find((l) => l.startsWith('SARLAVHA:'));
    if (titleLine) {
      title = titleLine.replace('SARLAVHA:', '').trim();
    }

    const slug = `${generateSlug(title)}-${Date.now()}`;

    const post = await this.prisma.post.create({
      data: {
        title,
        slug,
        content: aiResult.content,
        summary: `"${domainName}" sohasidagi ta'limiy maqola: ${data.topic}`,
        type: 'EDUCATIONAL_ARTICLE',
        status: 'DRAFT',
        legalDomain: data.legalDomain || 'GENERAL',
        isVerified: false,
        verificationStatus: 'PENDING_VERIFICATION',
        authorId: data.userId || null,
        originalContent: aiResult.content,
        tags: [domainName, 'Ta\'lim', 'Qonunchilik'],
      },
    });

    this.logger.log(`Ta'limiy maqola qoralamasi yaratildi (ID: ${post.id})`);
    return post;
  }

  async getAllArticles(domain?: any, status?: any) {
    return this.prisma.post.findMany({
      where: {
        type: 'EDUCATIONAL_ARTICLE',
        ...(domain && { legalDomain: domain }),
        ...(status && { status }),
      },
      include: {
        author: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
