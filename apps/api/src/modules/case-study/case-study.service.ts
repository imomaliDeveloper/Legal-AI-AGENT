import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { generateSlug } from '@legal-aid-ai/shared';

@Injectable()
export class CaseStudyService {
  private readonly logger = new Logger(CaseStudyService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
  ) {}

  async generateCaseStudy(data: {
    legalDomain: any;
    difficulty?: any;
    topic?: string;
    userId?: string;
  }) {
    const systemPrompt = `Siz O‘zbekiston qonunchiligi bo‘yicha amaliy kazuslar (huquqiy vaziyatlar) tuzuvchi ekspert va "LEGAL AID AI" platformasining Case Study Agentisiz.
Qat'iy qoidalar:
1. Matn faqat O‘zbek tilida (Lotin yozuvida).
2. Vaziyat (kazus) hayotiy, qiziqarli va o‘quvchini fikrlashga chorlovchi bo‘lsin.
3. MUHIM: To‘qima kazuslarni real sud qarori sifatida taqdim etmang! Matnda bu o‘quv-amaliy vaziyat ekanligi ko‘rsatilsin.
4. Javob variantlari to‘rtta bo‘lsin (A, B, C, D).
5. To‘g‘ri javob O‘zbekiston Respublikasining amaldagi qonunchiligi bilan qat'iy asoslansin.
6. Javob formati:
---
SARLAVHA: [Kazus sarlavhasi]
VAZIYAT (KAZUS): [Batafsil hayotiy voqea]
HUQUQIY SAVOL: [Vaziyat bo‘yicha yechilishi kerak bo‘lgan huquqiy savol]
VARIANT A: [1-variant]
VARIANT B: [2-variant]
VARIANT C: [3-variant]
VARIANT D: [4-variant]
TO‘G‘RI JAVOB: [A, B, C yoki D]
TAHLIL VA ASOSLASH: [Batafsil huquqiy tahlil]
QO‘LLANILGAN QONUNCHILIK: [Aniq qonun va moddalar, masalan: Mehnat kodeksi 161-modda]
MANBA: [https://lex.uz/...]`;

    const prompt = `Soha: ${data.legalDomain || 'FUQAROLIK'}. Daraja: ${data.difficulty || 'INTERMEDIATE'}. ${data.topic ? `Mavzu: ${data.topic}` : 'Qiziqarli amaliy huquqiy vaziyat tuzing'}.`;

    const aiResult = await this.aiProvider.generate('case_study_generation', prompt, systemPrompt);

    const lines = aiResult.content.split('\n');
    let title = 'Huquqiy kazus va amaliy vaziyat';
    const titleLine = lines.find((l) => l.startsWith('SARLAVHA:'));
    if (titleLine) {
      title = titleLine.replace('SARLAVHA:', '').trim();
    }

    const optA = lines.find((l) => l.startsWith('VARIANT A:'))?.replace('VARIANT A:', '').trim() || 'A varianti';
    const optB = lines.find((l) => l.startsWith('VARIANT B:'))?.replace('VARIANT B:', '').trim() || 'B varianti';
    const optC = lines.find((l) => l.startsWith('VARIANT C:'))?.replace('VARIANT C:', '').trim() || 'C varianti';
    const optD = lines.find((l) => l.startsWith('VARIANT D:'))?.replace('VARIANT D:', '').trim() || 'D varianti';
    const correct = lines.find((l) => l.startsWith('TO‘G‘RI JAVOB:'))?.replace('TO‘G‘RI JAVOB:', '').trim() || 'A';

    const options = [
      { id: 'A', text: optA, isCorrect: correct.includes('A') },
      { id: 'B', text: optB, isCorrect: correct.includes('B') },
      { id: 'C', text: optC, isCorrect: correct.includes('C') },
      { id: 'D', text: optD, isCorrect: correct.includes('D') },
    ];

    const slug = `${generateSlug(title)}-${Date.now()}`;

    // Create post & case study
    const post = await this.prisma.post.create({
      data: {
        title,
        slug,
        content: aiResult.content,
        summary: `Amaliy kazus: ${title}`,
        type: 'CASE_STUDY',
        status: 'DRAFT',
        legalDomain: data.legalDomain || 'GENERAL',
        authorId: data.userId || null,
        originalContent: aiResult.content,
        tags: ['Kazus', 'Amaliyot', data.legalDomain || 'General'],
      },
    });

    const caseStudy = await this.prisma.caseStudy.create({
      data: {
        title,
        scenario: lines.find((l) => l.startsWith('VAZIYAT (KAZUS):'))?.replace('VAZIYAT (KAZUS):', '').trim() || aiResult.content,
        legalQuestion: lines.find((l) => l.startsWith('HUQUQIY SAVOL:'))?.replace('HUQUQIY SAVOL:', '').trim() || 'Ushbu vaziyatda qonun nima deydi?',
        legalDomain: data.legalDomain || 'GENERAL',
        difficulty: data.difficulty || 'INTERMEDIATE',
        options: options as any,
        correctAnswer: correct,
        explanation: lines.find((l) => l.startsWith('TAHLIL VA ASOSLASH:'))?.replace('TAHLIL VA ASOSLASH:', '').trim() || '',
        applicableLaws: [lines.find((l) => l.startsWith('QO‘LLANILGAN QONUNCHILIK:'))?.replace('QO‘LLANILGAN QONUNCHILIK:', '').trim() || 'O‘zbekiston Qonunchiligi'],
        sourceLinks: ['https://lex.uz'],
        status: 'DRAFT',
        postId: post.id,
      },
    });

    this.logger.log(`Kazus yaratildi (ID: ${caseStudy.id}, PostID: ${post.id})`);
    return { post, caseStudy };
  }

  async getAll(status?: any) {
    return this.prisma.caseStudy.findMany({
      where: status ? { status } : undefined,
      include: { post: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string) {
    return this.prisma.caseStudy.findUnique({
      where: { id },
      include: { post: true },
    });
  }
}
