import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';

@Injectable()
export class SubscriberQuestionsService {
  private readonly logger = new Logger(SubscriberQuestionsService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
  ) {}

  async receiveQuestion(data: {
    telegramId: string;
    question: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }) {
    // 1. Find or create subscriber
    const subscriber = await this.prisma.subscriber.upsert({
      where: { telegramId: data.telegramId },
      update: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        lastActiveAt: new Date(),
      },
      create: {
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // 2. Save question
    const question = await this.prisma.subscriberQuestion.create({
      data: {
        subscriberId: subscriber.id,
        questionText: data.question,
        responseStatus: 'RECEIVED',
      },
    });

    // 3. Process with AI in background
    this.processQuestionWithAI(question.id, data.question).catch((err) => {
      this.logger.error(`Savolga javob tayyorlashda xatolik: ${err.message}`);
    });

    return question;
  }

  async processQuestionWithAI(questionId: string, questionText: string) {
    await this.prisma.subscriberQuestion.update({
      where: { id: questionId },
      data: { responseStatus: 'PROCESSING' },
    });

    const systemPrompt = `Siz O‘zbekiston Respublikasi qonunchiligi bo‘yicha fuqarolarning huquqiy savollariga maslahat beruvchi malakali huquqshunos-ekspert va "LEGAL AID AI" platformasining Q&A Agentisiz.
Qat'iy qoidalar:
1. Javob faqat O‘zbek tilida (Lotin yozuvida), sodda va samimiy tilda bo‘lsin.
2. Huquqiy sohani aniqlang (Mehnat, Oila, Fuqarolik, Ma'muriy va h.k.).
3. Savoldagi kamchiliklar yoki aniqlashtirilishi kerak bo‘lgan holatlarni ko‘rsating.
4. Tegishli O‘zbekiston qonunchiligi moddalariga havola bering.
5. MUHIM: Bu javob yakuniy rasmiy sud hujjati yoki majburiy yuridik xulosa emasligini, balki huquqiy maslahat ekanligini ta'kidlang.
6. Javob formati:
---
HUQUQIY SOHA: [Soha nomi]
JAVOB: [Batafsil va tushunarli maslahat]
QONUNCHILIK ASOSI: [Qonun/kodeks moddalari]
AMALIY QADAMLAR: [Fuqaro birinchi navbatda nima qilishi kerak?]
ESLATMA: [Ushbu maslahat axborot-ma'rifiy xarakterga ega va rasmiy yuridik xulosa hisoblanmaydi.]`;

    const prompt = `Fuqaroning huquqiy savoli:\n"${questionText}"\n\nIltimos, ushbu savolga O‘zbekiston qonunchiligiga tayangan holda professional huquqiy maslahat tayyorlang.`;

    const aiResult = await this.aiProvider.generate('subscriber_qa', prompt, systemPrompt);

    // Extract domain if present
    let detectedDomain = 'GENERAL';
    const domainLine = aiResult.content.split('\n').find((l) => l.startsWith('HUQUQIY SOHA:'));
    if (domainLine) {
      const d = domainLine.toLowerCase();
      if (d.includes('mehnat')) detectedDomain = 'LABOR';
      else if (d.includes('oila')) detectedDomain = 'FAMILY';
      else if (d.includes('jinoyat')) detectedDomain = 'CRIMINAL';
      else if (d.includes('fuqaro')) detectedDomain = 'CIVIL';
      else if (d.includes('soliq')) detectedDomain = 'TAX';
      else if (d.includes('biznes') || d.includes('tadbirkor')) detectedDomain = 'BUSINESS';
      else if (d.includes('ma\'muriy')) detectedDomain = 'ADMINISTRATIVE';
      else if (d.includes('inson huquq')) detectedDomain = 'HUMAN_RIGHTS';
    }

    // Update with AI draft, requiring admin review
    const updated = await this.prisma.subscriberQuestion.update({
      where: { id: questionId },
      data: {
        aiResponse: aiResult.content,
        detectedDomain: detectedDomain as any,
        responseStatus: 'PENDING_REVIEW', // Semi-autonomous: requires human review
      },
    });

    this.logger.log(`Obunachi savoliga AI javobi tayyorlandi va tekshiruvga yuborildi (ID: ${questionId})`);
    return updated;
  }

  async getAllQuestions(status?: any) {
    return this.prisma.subscriberQuestion.findMany({
      where: status ? { responseStatus: status } : undefined,
      include: { subscriber: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewAndSendAnswer(id: string, finalResponse: string, reviewedBy: string) {
    const q = await this.prisma.subscriberQuestion.findUnique({
      where: { id },
      include: { subscriber: true },
    });

    if (!q) throw new NotFoundException('Savol topilmadi');

    return this.prisma.subscriberQuestion.update({
      where: { id },
      data: {
        finalResponse,
        reviewedBy,
        responseStatus: 'REVIEWED',
        responseSentAt: new Date(),
      },
    });
  }
}
