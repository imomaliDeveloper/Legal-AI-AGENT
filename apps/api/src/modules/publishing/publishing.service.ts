import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Telegraf } from 'telegraf';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);
  private bot: Telegraf | null = null;
  private channelId: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID') || '@Huquq_study';

    if (token) {
      try {
        this.bot = new Telegraf(token);
        this.logger.log(`Telegram Bot nashriyot xizmati sozlandi (Kanal: ${this.channelId})`);
      } catch (err) {
        this.logger.warn(`Telegram Botni ishga tushirishda ogohlantirish: ${err.message}`);
      }
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN ko\'rsatilmagan. Telegram nashriyoti faol emas.');
    }
  }

  async publishCustomText(text: string) {
    if (!this.bot) return null;
    return this.bot.telegram.sendMessage(this.channelId, text, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: false },
    });
  }

  private escapeHtml(text: string): string {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private getDomainHashtag(domain?: string): string {
    const map: Record<string, string> = {
      LABOR: '#mehnat_huquqi',
      CIVIL: '#fuqarolik_huquqi',
      FAMILY: '#oila_huquqi',
      ADMINISTRATIVE: '#mamuriy_huquq',
      CRIMINAL: '#jinoyat_huquqi',
      BUSINESS: '#biznes_huquqi',
      TAX: '#soliq_huquqi',
      HUMAN_RIGHTS: '#inson_huquqlari',
      CONSTITUTIONAL: '#konstitutsiya',
      GENERAL: '#huquqiy_savodxonlik',
    };
    return map[domain || ''] || '#huquq';
  }

  // Master Telegram Styler — Creates high-aesthetic, professional legal media posts
  formatPostForTelegram(post: any): string {
    const divider = '━━━━━━━━━━━━━━━━━━━━';
    const domainTag = this.getDomainHashtag(post.legalDomain);
    const content = post.content || '';
    const lines = content.split('\n');

    // Helper to extract fields like "KEY: value" or multiline section
    const getField = (prefix: string) => {
      const idx = lines.findIndex((l: string) => l.trim().startsWith(prefix));
      if (idx === -1) return '';
      let val = lines[idx].replace(prefix, '').trim();
      // collect following lines until next KEY: or end
      for (let i = idx + 1; i < lines.length; i++) {
        const nextLine = lines[i].trim();
        if (nextLine.match(/^[A-ZА-ЯЁ‘'\s]+:/)) break;
        if (nextLine) val += '\n' + nextLine;
      }
      return val.trim();
    };

    if (post.type === 'CASE_STUDY') {
      const scenario = getField('VAZIYAT (KAZUS):') || post.caseStudy?.scenario || '';
      const question = getField('HUQUQIY SAVOL:') || post.caseStudy?.legalQuestion || '';
      const optA = getField('VARIANT A:') || 'A varianti';
      const optB = getField('VARIANT B:') || 'B varianti';
      const optC = getField('VARIANT C:') || 'C varianti';
      const optD = getField('VARIANT D:') || 'D varianti';
      const correct = getField('TO‘G‘RI JAVOB:') || post.caseStudy?.correctAnswer || 'A';
      const analysis = getField('TAHLIL VA ASOSLASH:') || post.caseStudy?.explanation || '';
      const laws = getField('QO‘LLANILGAN QONUNCHILIK:') || (post.caseStudy?.applicableLaws || []).join(', ') || 'O‘zR qonunlari';

      return (
        `🔍 <b>#SUD_AMALIYOTI | AMALIY KAZUS</b>\n\n` +
        `📌 <b>${this.escapeHtml(post.title)}</b>\n` +
        `${divider}\n\n` +
        `📋 <b>Vaziyat tafsiloti:</b>\n${this.escapeHtml(scenario)}\n\n` +
        `❓ <b>Huquqiy savol:</b>\n<i>${this.escapeHtml(question)}</i>\n\n` +
        `▫️ <b>A)</b> ${this.escapeHtml(optA)}\n` +
        `▫️ <b>B)</b> ${this.escapeHtml(optB)}\n` +
        `▫️ <b>C)</b> ${this.escapeHtml(optC)}\n` +
        `▫️ <b>D)</b> ${this.escapeHtml(optD)}\n\n` +
        `${divider}\n` +
        `💡 <i>To‘g‘ri javob va sud tahlilini ko‘rish uchun quyidagi yopiq qism ustiga bosing:</i>\n\n` +
        `<tg-spoiler>` +
        `✅ <b>Qonuniy yechim va sud tahlili:</b>\n` +
        `To‘g‘ri javob: <b>${this.escapeHtml(correct)}-varianti</b>\n\n` +
        `${this.escapeHtml(analysis)}\n\n` +
        `⚖️ <b>Asos:</b> <code>${this.escapeHtml(laws)}</code>\n` +
        `🔗 <b>Manba:</b> <a href="https://lex.uz">Lex.uz davlat qonunchilik portali</a>` +
        `</tg-spoiler>\n` +
        `${divider}\n` +
        `🎯 <b>Huquqiy savodxonlikni birga oshiramiz!</b>\n` +
        `👉 <b>Kanalimiz:</b> ${this.channelId}\n\n` +
        `${domainTag} #kazus #sud_amaliyoti #huquq_study`
      );
    }

    if (post.type === 'EDUCATIONAL_ARTICLE') {
      const intro = getField('KIRISH VA HUQUQIY TUSHUNCHA:');
      const basis = getField('QONUNCHILIK ASOSI:');
      const examples = getField('AMALIY HAYOTIY MISOLLAR:');
      const advice = getField('FOYDALI MASLAHATLAR / XULOSA:');
      const source = getField('RASMIY MANBALAR:') || 'https://lex.uz';

      if (intro || basis) {
        return (
          `📚 <b>#HUQUQIY_SAVODXONLIK | TA'LIMIY MAQOLA</b>\n\n` +
          `📌 <b>${this.escapeHtml(post.title)}</b>\n` +
          `${divider}\n\n` +
          (intro ? `📖 <b>Huquqiy tushuncha:</b>\n${this.escapeHtml(intro)}\n\n` : '') +
          (basis ? `⚖️ <b>Qonunchilik asosi:</b>\n<code>${this.escapeHtml(basis)}</code>\n\n` : '') +
          (examples ? `💡 <b>Amaliy misollar:</b>\n${this.escapeHtml(examples)}\n\n` : '') +
          (advice ? `🛡 <b>Yurist maslahati:</b>\n${this.escapeHtml(advice)}\n\n` : '') +
          `🔗 <b>Rasmiy manba:</b> <a href="${this.escapeHtml(source)}">Lex.uz milliy qonunchilik bazasi</a>\n` +
          `${divider}\n` +
          `🎯 <b>LEGAL AID — Huquqiy bilimlarni birga oshiramiz!</b>\n` +
          `👉 <b>Kanalga a'zo bo‘ling:</b> ${this.channelId}\n\n` +
          `${domainTag} #taʼlim #qonun #advokat #huquq_study`
        );
      }
    }

    if (post.type === 'NEWS') {
      const intro = getField('QISQA KIRISH:') || getField('QISQACHA MAZMUNI:');
      const changed = getField('NIMA O‘ZGARDI?:') || getField('BATAFSIL SHARH:');
      const impact = getField('KIMLARGA TA\'SIR QILADI?:') || getField('AMALIY AHAMIYATI:');
      const date = getField('KUCHGA KIRISH SANASI:');
      const basis = getField('RASMIY ASOS:');

      if (intro || changed) {
        return (
          `📢 <b>#RASMIY_QONUNCHILIK | YANGILIKLAR</b>\n\n` +
          `📌 <b>${this.escapeHtml(post.title)}</b>\n` +
          `${divider}\n\n` +
          (intro ? `📄 <b>Qisqacha mazmuni:</b>\n${this.escapeHtml(intro)}\n\n` : '') +
          (changed ? `🔍 <b>Asosiy o‘zgarishlar:</b>\n${this.escapeHtml(changed)}\n\n` : '') +
          (impact ? `💡 <b>Amaliy ahamiyati:</b>\n${this.escapeHtml(impact)}\n\n` : '') +
          (date ? `🗓 <b>Kuchga kirish sanasi:</b> <code>${this.escapeHtml(date)}</code>\n\n` : '') +
          (basis ? `⚖️ <b>Rasmiy asos:</b> <code>${this.escapeHtml(basis)}</code>\n` : '') +
          `🔗 <b>Rasmiy manba:</b> <a href="https://lex.uz">Lex.uz davlat portali</a>\n` +
          `${divider}\n` +
          `🎯 <b>LEGAL AID — Huquqiy bilimlarni birga oshiramiz!</b>\n` +
          `👉 <b>Kanalimiz:</b> ${this.channelId}\n\n` +
          `${domainTag} #yangilik #qonun #islohot #huquq_study`
        );
      }
    }

    // Default aesthetic styling for any other text post
    const cleanContent = this.escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/__(.*?)__/g, '<i>$1</i>');

    return (
      `⚖️ <b>#HUQUQIY_MA'LUMOT | @Huquq_study</b>\n\n` +
      `📌 <b>${this.escapeHtml(post.title)}</b>\n` +
      `${divider}\n\n` +
      `${cleanContent}\n\n` +
      `${divider}\n` +
      `🎯 <b>Huquqiy bilimlarni birga oshiramiz!</b>\n` +
      `👉 <b>Kanalga a'zo bo‘ling:</b> ${this.channelId}\n\n` +
      `${domainTag} #qonun #huquq #huquq_study`
    );
  }

  async publishApprovedPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        publications: true,
        caseStudy: true,
        quiz: {
          include: {
            questions: { include: { options: true } },
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post topilmadi');

    // Strict rule: Only APPROVED posts can be published
    if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED') {
      throw new BadRequestException(
        `Faqat APPROVED yoki SCHEDULED holatidagi postlarni nashr qilish mumkin. Joriy holat: ${post.status}`,
      );
    }

    // Prevent duplicate publishing
    const alreadyPublished = post.publications.some((p) => p.isSuccessful);
    if (alreadyPublished) {
      throw new BadRequestException('Ushbu post allaqachon Telegram kanalga muvaffaqiyatli nashr qilingan!');
    }

    let messageId: string | null = null;
    let messageType = 'text';
    let contentSent = post.content;

    try {
      if (this.bot) {
        // If it's a quiz, publish an introductory teaser followed by Telegram Native Quiz
        if (post.type === 'QUIZ' && post.quiz && post.quiz.questions.length > 0) {
          const q = post.quiz.questions[0];
          messageType = 'poll';
          const optionsText = q.options.map((o) => o.optionText.slice(0, 100));
          const correctIndex = q.options.findIndex((o) => o.isCorrect);

          // 1. Send branded header teaser
          const domainTag = this.getDomainHashtag(post.legalDomain);
          const quizIntro = (
            `🧠 <b>#KUN_TESTI | HUQUQIY VIKTORINA</b>\n\n` +
            `📌 <b>${this.escapeHtml(post.title)}</b>\n` +
            `🏷 <b>Soha:</b> ${domainTag}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Quyidagi testda bilimingizni sinang va to‘g‘ri javobning qonuniy asosini bilib oling 👇`
          );
          try {
            await this.bot.telegram.sendMessage(this.channelId, quizIntro, { parse_mode: 'HTML' });
          } catch (_) {}

          // 2. Send the quiz poll
          const pollMsg = await this.bot.telegram.sendQuiz(
            this.channelId,
            `⚖️ ${q.questionText.slice(0, 300)}`,
            optionsText,
            {
              is_anonymous: true,
              correct_option_id: correctIndex >= 0 ? correctIndex : 0,
              explanation: q.explanation ? q.explanation.slice(0, 200) : 'To‘g‘ri javob qonun bilan asoslangan.',
            },
          );
          messageId = pollMsg.message_id.toString();
        } else {
          // Master-styled legal post with premium typography, dividers, and branding
          const formattedText = this.formatPostForTelegram(post);
          contentSent = formattedText;

          const sent = await this.bot.telegram.sendMessage(this.channelId, formattedText, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: false },
          });
          messageId = sent.message_id.toString();
        }
      } else {
        this.logger.warn(`Telegram Bot token yo‘qligi sababli simulyatsiya qilinmoqda (Post: ${post.id})`);
        messageId = `sim_${Date.now()}`;
      }

      // Record successful publication
      return await this.prisma.$transaction(async (tx) => {
        await tx.telegramPublication.create({
          data: {
            postId: post.id,
            channelId: this.channelId,
            messageId,
            messageType,
            contentSent,
            isSuccessful: true,
          },
        });

        const updatedPost = await tx.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'post.publish',
            entityType: 'Post',
            entityId: post.id,
            details: { channelId: this.channelId, messageId, messageType },
          },
        });

        this.logger.log(`Post muvaffaqiyatli kanalga nashr qilindi! (ID: ${post.id}, MsgID: ${messageId})`);
        return updatedPost;
      });
    } catch (err: any) {
      this.logger.error(`Telegram kanalga nashr qilishda xato: ${err.message}`);

      // Record failed publication
      await this.prisma.telegramPublication.create({
        data: {
          postId: post.id,
          channelId: this.channelId,
          messageType,
          contentSent,
          isSuccessful: false,
          errorMessage: err.message,
        },
      });

      await this.prisma.post.update({
        where: { id: post.id },
        data: { status: 'FAILED' },
      });

      throw new BadRequestException(`Nashr qilishda xatolik: ${err.message}`);
    }
  }

  async getPublicationHistory() {
    return this.prisma.telegramPublication.findMany({
      include: {
        post: { select: { title: true, type: true, legalDomain: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }
}
