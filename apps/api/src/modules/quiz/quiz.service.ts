import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { generateSlug } from '@legal-aid-ai/shared';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
  ) {}

  async generateQuiz(data: {
    legalDomain: any;
    difficulty?: any;
    topic?: string;
    questionCount?: number;
    userId?: string;
  }) {
    const count = data.questionCount || 1;
    const systemPrompt = `Siz O‘zbekiston qonunchiligi bo‘yicha testlar (viktorina) tuzuvchi mutaxassis va "LEGAL AID AI" platformasining Quiz Agentisiz.
Qat'iy qoidalar:
1. Matnni faqat O‘zbek tilida (Lotin yozuvida) tayyorlang.
2. Har bir savol amaldagi O‘zbekiston Respublikasi qonunlari asosida bo‘lsin.
3. To‘g‘ri javobning qonuniy asosi (moddasi) aniq ko‘rsatilsin.
4. Har bir savolda 4 ta variant (A, B, C, D) bo‘lsin.
5. Format:
---
VIKTORINA NOMI: [Mavzuga mos nom]
SAVOL: [Savol matni]
VARIANT A: [1-variant]
VARIANT B: [2-variant]
VARIANT C: [3-variant]
VARIANT D: [4-variant]
TO‘G‘RI JAVOB: [A, B, C yoki D]
TUSHUNTIRISH: [Nima uchun bu javob to‘g‘ri?]
HUQUQIY ASOS: [Qonun nomi, moddasi, masalan: O‘zR Konstitutsiyasi 25-modda]
MANBA: [https://lex.uz/...]`;

    const prompt = `Soha: ${data.legalDomain || 'FUQAROLIK'}. Daraja: ${data.difficulty || 'BEGINNER'}. ${data.topic ? `Mavzu: ${data.topic}` : 'Qonunchilik bo‘yicha test savoli tuzing'}.`;

    const aiResult = await this.aiProvider.generate('quiz_generation', prompt, systemPrompt);

    const lines = aiResult.content.split('\n');
    let title = 'Huquqiy bilimlar viktorinasi';
    const titleLine = lines.find((l) => l.startsWith('VIKTORINA NOMI:'));
    if (titleLine) {
      title = titleLine.replace('VIKTORINA NOMI:', '').trim();
    }

    const questionText = lines.find((l) => l.startsWith('SAVOL:'))?.replace('SAVOL:', '').trim() || 'O‘zbekiston Respublikasi qonunchiligi bo‘yicha savol:';
    const optA = lines.find((l) => l.startsWith('VARIANT A:'))?.replace('VARIANT A:', '').trim() || 'Variant A';
    const optB = lines.find((l) => l.startsWith('VARIANT B:'))?.replace('VARIANT B:', '').trim() || 'Variant B';
    const optC = lines.find((l) => l.startsWith('VARIANT C:'))?.replace('VARIANT C:', '').trim() || 'Variant C';
    const optD = lines.find((l) => l.startsWith('VARIANT D:'))?.replace('VARIANT D:', '').trim() || 'Variant D';
    const correct = lines.find((l) => l.startsWith('TO‘G‘RI JAVOB:'))?.replace('TO‘G‘RI JAVOB:', '').trim() || 'A';
    const explanation = lines.find((l) => l.startsWith('TUSHUNTIRISH:'))?.replace('TUSHUNTIRISH:', '').trim() || '';
    const legalBasis = lines.find((l) => l.startsWith('HUQUQIY ASOS:'))?.replace('HUQUQIY ASOS:', '').trim() || 'O‘zbekiston Qonunchiligi';

    const slug = `${generateSlug(title)}-${Date.now()}`;

    // Create post
    const post = await this.prisma.post.create({
      data: {
        title,
        slug,
        content: aiResult.content,
        summary: `Test viktorina: ${title}`,
        type: 'QUIZ',
        status: 'DRAFT',
        legalDomain: data.legalDomain || 'GENERAL',
        authorId: data.userId || null,
        originalContent: aiResult.content,
        tags: ['Test', 'Viktorina', data.legalDomain || 'General'],
      },
    });

    // Create Quiz with Question & Options
    const quiz = await this.prisma.quiz.create({
      data: {
        title,
        description: `Viktorina: ${title}`,
        legalDomain: data.legalDomain || 'GENERAL',
        difficulty: data.difficulty || 'BEGINNER',
        status: 'DRAFT',
        postId: post.id,
        questions: {
          create: [
            {
              questionText,
              questionType: 'SINGLE_ANSWER',
              explanation,
              legalBasis,
              sourceUrl: 'https://lex.uz',
              orderIndex: 0,
              options: {
                create: [
                  { optionText: optA, isCorrect: correct.includes('A'), orderIndex: 0 },
                  { optionText: optB, isCorrect: correct.includes('B'), orderIndex: 1 },
                  { optionText: optC, isCorrect: correct.includes('C'), orderIndex: 2 },
                  { optionText: optD, isCorrect: correct.includes('D'), orderIndex: 3 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    this.logger.log(`Viktorina yaratildi (ID: ${quiz.id}, PostID: ${post.id})`);
    return { post, quiz };
  }

  async getAllQuizzes(status?: any) {
    return this.prisma.quiz.findMany({
      where: status ? { status } : undefined,
      include: {
        questions: {
          include: { options: true },
        },
        post: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuiz(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
        },
        post: true,
      },
    });
  }
}
