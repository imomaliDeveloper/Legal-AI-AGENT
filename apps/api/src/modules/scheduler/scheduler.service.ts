import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishingService } from '../publishing/publishing.service';
import { EducationalContentService } from '../educational-content/educational-content.service';
import { QuizService } from '../quiz/quiz.service';
import { CaseStudyService } from '../case-study/case-study.service';
import { NewsService } from '../news/news.service';
import { TelegramService } from '../telegram/telegram.service';

const CURATED_TOPICS = [
  { domain: 'LABOR', topic: 'Mehnat shartnomasini bekor qilish tartibi va xodimning huquqiy kafolatlari' },
  { domain: 'FAMILY', topic: 'Aliment to‘lash tartibi, miqdori va to‘lamaslik oqibatlari' },
  { domain: 'CIVIL', topic: 'Qarz tilxati va notarial tasdiqlashning yuridik ahamiyati' },
  { domain: 'ADMINISTRATIVE', topic: 'Yo‘l harakati qoidalarini buzganlik uchun jarimalar va ularni qayta ko‘rib chiqish tartibi' },
  { domain: 'BUSINESS', topic: 'Yakka tartibdagi tadbirkor (YATT) va MChJ o‘rtasidagi asosiy huquqiy farqlar' },
  { domain: 'HUMAN_RIGHTS', topic: 'Fuqarolarning shaxsiy daxlsizligi va shaxsga doir maʼlumotlarini himoya qilish huquqi' },
  { domain: 'TAX', topic: 'O‘zini o‘zi band qilgan shaxslar uchun soliq imtiyozlari va qulayliklar' },
  { domain: 'CONSTITUTIONAL', topic: 'Yangi tahrirdagi O‘zbekiston Konstitutsiyasida inson shaʼni va qadr-qimmati kafolatlari' },
];

export interface ScheduleSettings {
  morningTime: string;
  lunchTime: string;
  eveningTime: string;
  sundayBlitzTime: string;
  isEnabled: boolean;
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private isPublishingJobRunning = false;
  private isAutopilotRunning = false;
  private lastExecutedDynamicTimes: Record<string, string> = {};

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private publishingService: PublishingService,
    private educationalService: EducationalContentService,
    private quizService: QuizService,
    private caseStudyService: CaseStudyService,
    private newsService: NewsService,
    private telegramService: TelegramService,
  ) {}

  // Get current dynamic schedule times from DB
  async getScheduleSettings(): Promise<ScheduleSettings> {
    const defaults: ScheduleSettings = {
      morningTime: '09:00',
      lunchTime: '13:00',
      eveningTime: '20:30',
      sundayBlitzTime: '20:00',
      isEnabled: true,
    };

    try {
      const settings = await this.prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'SCHEDULE_MORNING',
              'SCHEDULE_LUNCH',
              'SCHEDULE_EVENING',
              'SCHEDULE_SUNDAY_BLITZ',
              'SCHEDULE_ENABLED',
            ],
          },
        },
      });

      for (const s of settings) {
        if (s.key === 'SCHEDULE_MORNING' && s.value) defaults.morningTime = s.value;
        if (s.key === 'SCHEDULE_LUNCH' && s.value) defaults.lunchTime = s.value;
        if (s.key === 'SCHEDULE_EVENING' && s.value) defaults.eveningTime = s.value;
        if (s.key === 'SCHEDULE_SUNDAY_BLITZ' && s.value) defaults.sundayBlitzTime = s.value;
        if (s.key === 'SCHEDULE_ENABLED') defaults.isEnabled = s.value !== 'false';
      }
    } catch (_) {}

    return defaults;
  }

  // Update dynamic schedule times in DB
  async updateScheduleSettings(data: Partial<ScheduleSettings>): Promise<ScheduleSettings> {
    const keysMap: Record<keyof ScheduleSettings, string> = {
      morningTime: 'SCHEDULE_MORNING',
      lunchTime: 'SCHEDULE_LUNCH',
      eveningTime: 'SCHEDULE_EVENING',
      sundayBlitzTime: 'SCHEDULE_SUNDAY_BLITZ',
      isEnabled: 'SCHEDULE_ENABLED',
    };

    for (const [key, val] of Object.entries(data)) {
      const settingKey = keysMap[key as keyof ScheduleSettings];
      if (settingKey && val !== undefined) {
        const strVal = String(val);
        await this.prisma.systemSetting.upsert({
          where: { key: settingKey },
          update: { value: strVal },
          create: {
            key: settingKey,
            value: strVal,
            category: 'scheduling',
            description: `Cron schedule setting for ${key}`,
          },
        });
      }
    }

    this.logger.log(`Vaqt jadvali yangilandi: ${JSON.stringify(data)}`);
    return this.getScheduleSettings();
  }

  // Mode: '1' = Semi-Autonomous (Requires Admin Approval), '2' = Full Autonomous (Auto-Publish)
  async getAutonomousMode(): Promise<string> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'AUTONOMOUS_MODE' },
      });
      if (setting && setting.value) return setting.value;
    } catch (_) {}
    return this.configService.get<string>('AUTONOMOUS_MODE') || '2';
  }

  async setAutonomousMode(mode: '1' | '2'): Promise<string> {
    await this.prisma.systemSetting.upsert({
      where: { key: 'AUTONOMOUS_MODE' },
      update: { value: mode, description: mode === '2' ? 'To‘liq Avtopilot (Avtomatik nashr)' : 'Yarim-avtonom (Tasdiqlash bilan)' },
      create: {
        key: 'AUTONOMOUS_MODE',
        value: mode,
        category: 'automation',
        description: mode === '2' ? 'To‘liq Avtopilot (Avtomatik nashr)' : 'Yarim-avtonom (Tasdiqlash bilan)',
      },
    });
    this.logger.log(`Avtonom rejim o‘zgartirildi: Mode ${mode}`);
    return mode;
  }

  // Check every minute for scheduled publications
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledPublications() {
    if (this.isPublishingJobRunning) {
      this.logger.debug('Avvalgi rejalashtirish vazifasi hali davom etmoqda, o‘tkazib yuborildi');
      return;
    }

    this.isPublishingJobRunning = true;

    try {
      const now = new Date();
      // Find all scheduled publications due now and not executed
      const duePublications = await this.prisma.scheduledPublication.findMany({
        where: {
          isExecuted: false,
          scheduledFor: { lte: now },
          retryCount: { lt: 3 },
        },
        include: { post: true },
        take: 5,
      });

      for (const sp of duePublications) {
        if (sp.post.status !== 'APPROVED') {
          this.logger.warn(`Post (ID: ${sp.postId}) APPROVED emas (Status: ${sp.post.status}). Nashr to‘xtatildi.`);
          await this.prisma.scheduledPublication.update({
            where: { id: sp.id },
            data: {
              failedAt: now,
              failureReason: `Post statusi ${sp.post.status}, APPROVED emas.`,
              isExecuted: false,
            },
          });
          continue;
        }

        try {
          await this.publishingService.publishApprovedPost(sp.postId);

          await this.prisma.scheduledPublication.update({
            where: { id: sp.id },
            data: {
              isExecuted: true,
              executedAt: new Date(),
            },
          });
          this.logger.log(`Rejalashtirilgan post muvaffaqiyatli nashr qilindi (Post: ${sp.postId})`);
        } catch (pubErr: any) {
          this.logger.error(`Rejalashtirilgan nashrda xato: ${pubErr.message}`);
          await this.prisma.scheduledPublication.update({
            where: { id: sp.id },
            data: {
              failedAt: new Date(),
              failureReason: pubErr.message,
              retryCount: { increment: 1 },
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Rejalashtirish skanida xato: ${err.message}`);
    } finally {
      this.isPublishingJobRunning = false;
    }
  }

  // =========================================================================
  // DINAMIK VAQT JADVALI (DYNAMIC CRON ENGINE - ASIA/TASHKENT)
  // Har daqiqada foydalanuvchi belgilagan vaqtlarni tekshiradi va post chiqaradi
  // =========================================================================
  @Cron(CronExpression.EVERY_MINUTE)
  async processDynamicPrimeTimeCron() {
    try {
      const settings = await this.getScheduleSettings();
      if (!settings.isEnabled) return;

      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Tashkent',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tashkent',
        weekday: 'short',
      });

      const currentTime = timeFormatter.format(now);
      const todayDate = dateFormatter.format(now);
      const dayOfWeek = dayOfWeekFormatter.format(now); // "Sun", "Mon", etc.

      // 1. Ertalabki Maqola (Default: 09:00 yoki foydalanuvchi belgilagan vaqt)
      const morningKey = `morning_${todayDate}`;
      if (currentTime === settings.morningTime && !this.lastExecutedDynamicTimes[morningKey]) {
        this.lastExecutedDynamicTimes[morningKey] = 'done';
        this.logger.log(`[Dinamik Jadval: ${currentTime}] Ertalabki ta’limiy post vaqti yetdi!`);
        await this.runAutopilotCycle('EDUCATIONAL');
      }

      // 2. Tushlik Viktorinasi (Default: 13:00 yoki foydalanuvchi belgilagan vaqt)
      const lunchKey = `lunch_${todayDate}`;
      if (currentTime === settings.lunchTime && !this.lastExecutedDynamicTimes[lunchKey]) {
        this.lastExecutedDynamicTimes[lunchKey] = 'done';
        this.logger.log(`[Dinamik Jadval: ${currentTime}] Tushlikdagi viktorina vaqti yetdi!`);
        await this.runAutopilotCycle('QUIZ');
      }

      // 3. Kechki Kazus (Default: 20:30, Dushanba-Shanba)
      const eveningKey = `evening_${todayDate}`;
      if (dayOfWeek !== 'Sun' && currentTime === settings.eveningTime && !this.lastExecutedDynamicTimes[eveningKey]) {
        this.lastExecutedDynamicTimes[eveningKey] = 'done';
        this.logger.log(`[Dinamik Jadval: ${currentTime}] Kechki amaliy kazus vaqti yetdi!`);
        await this.runAutopilotCycle('CASE_STUDY');
      }

      // 4. Yakshanba 5 talik Quiz Blitsi (Default: 20:00, Yakshanba)
      const blitzKey = `blitz_${todayDate}`;
      if (dayOfWeek === 'Sun' && currentTime === settings.sundayBlitzTime && !this.lastExecutedDynamicTimes[blitzKey]) {
        this.lastExecutedDynamicTimes[blitzKey] = 'done';
        this.logger.log(`[Dinamik Jadval: ${currentTime}] Yakshanba kungi 5 talik quiz blitsi vaqti yetdi!`);
        await this.runSundayWeeklyQuizBlitz();
      }
    } catch (err: any) {
      this.logger.error(`Dinamik jadval tekshiruvida xatolik: ${err.message}`);
    }
  }

  // Haftalik Yakuniy 5 talik Quiz Blitsi funksiyasi (qo‘lda ham chaqirilishi mumkin)
  async runSundayWeeklyQuizBlitz(): Promise<any> {
    this.logger.log('Haftalik 5 talik Quiz blitsi ishga tushirildi...');
    const channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID') || '@Huquq_study';

    // 1. Kirish e'lon kartasi
    const blitzIntro = (
      `🏆 <b>#HAFTALIK_BLITS | YAKUNIY HUQUQIY QUIZ</b>\n\n` +
      `📌 <b>Haftaning eng muhim 5 ta huquqiy testi!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `O‘zbekiston Respublikasi amaldagi qonunchiligi bo‘yicha bilimingizni sinab ko‘ring.\n` +
      `Quyida ketma-ket 5 ta savol e'lon qilinadi 👇`
    );

    try {
      await this.publishingService.publishCustomText(blitzIntro);
    } catch (_) {}

    // 2. 5 ta turli soha bo‘yicha testlar chiqarish
    const blitzDomains = ['LABOR', 'CIVIL', 'FAMILY', 'ADMINISTRATIVE', 'BUSINESS'];
    const results: any[] = [];

    for (let i = 0; i < blitzDomains.length; i++) {
      try {
        const topic = CURATED_TOPICS[i % CURATED_TOPICS.length];
        const res = await this.quizService.generateQuiz({
          legalDomain: blitzDomains[i],
          topic: topic.topic,
          difficulty: 'BEGINNER',
          questionCount: 1,
        });

        // Set approved and publish
        await this.prisma.post.update({
          where: { id: res.post.id },
          data: { status: 'APPROVED' },
        });

        const pub = await this.publishingService.publishApprovedPost(res.post.id);
        results.push(pub);

        // 1.5 soniya tanaffus (Telegram chekloviga tushmaslik uchun)
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err: any) {
        this.logger.warn(`Blits test ${i + 1} da xatolik: ${err.message}`);
      }
    }

    // 3. Adminga hisobot
    await this.telegramService.notifyAdminsDirect(
      `🏆 <b>[Haftalik Blits]</b> Yakshanba kungi 5 talik huquqiy test muvaffaqiyatli ${channelId} kanaliga chiqarildi!`
    );

    return { success: true, count: results.length, posts: results };
  }

  // Core Autopilot engine
  async runAutopilotCycle(forcedType?: 'QUIZ' | 'EDUCATIONAL' | 'CASE_STUDY' | 'NEWS'): Promise<any> {
    if (this.isAutopilotRunning) {
      this.logger.warn('Avtopilot allaqachon bajarilmoqda...');
      return { status: 'already_running', message: 'Avtopilot allaqachon jarayonda' };
    }

    this.isAutopilotRunning = true;
    const mode = await this.getAutonomousMode();
    this.logger.log(`[Autopilot] Boshlandi. Rejim: Mode ${mode} (${mode === '2' ? 'To‘liq avtomat' : 'Yarim avtomat'})`);

    try {
      // 1. Pick a topic
      const randomTopic = CURATED_TOPICS[Math.floor(Math.random() * CURATED_TOPICS.length)];
      
      // 2. Pick content type (Rotate Quiz, Educational, CaseStudy)
      const types: Array<'QUIZ' | 'EDUCATIONAL' | 'CASE_STUDY'> = ['QUIZ', 'EDUCATIONAL', 'CASE_STUDY'];
      const contentType = forcedType || types[Math.floor(Math.random() * types.length)];

      let post: any = null;

      if (contentType === 'QUIZ') {
        const res = await this.quizService.generateQuiz({
          legalDomain: randomTopic.domain,
          topic: randomTopic.topic,
          difficulty: 'BEGINNER',
          questionCount: 1,
        });
        post = res.post;
      } else if (contentType === 'CASE_STUDY') {
        const res = await this.caseStudyService.generateCaseStudy({
          legalDomain: randomTopic.domain,
          topic: randomTopic.topic,
          difficulty: 'INTERMEDIATE',
        });
        post = res.post;
      } else {
        post = await this.educationalService.generateArticle({
          legalDomain: randomTopic.domain,
          topic: randomTopic.topic,
          difficulty: 'BEGINNER',
        });
      }

      if (!post) {
        throw new Error('AI orqali post yaratish muvaffaqiyatsiz tugadi');
      }

      this.logger.log(`[Autopilot] Yangi post yaratildi: ${post.title} (ID: ${post.id}, Type: ${post.type})`);

      // 3. Execution based on Mode
      if (mode === '2') {
        // Mode 2: Full Autonomous -> Approve and Publish immediately
        await this.prisma.post.update({
          where: { id: post.id },
          data: { status: 'APPROVED' },
        });

        try {
          const published = await this.publishingService.publishApprovedPost(post.id);
          this.logger.log(`[Autopilot Mode 2] Post kanalga muvaffaqiyatli nashr qilindi!`);

          // Notify admin
          await this.telegramService.notifyAdminsDirect(
            `🚀 <b>[Mode 2: Avtopilot]</b> Yangi post avtomatik nashr qilindi!\n\n` +
            `📝 <b>Sarlavha:</b> ${post.title}\n` +
            `🏷 <b>Turi:</b> ${post.type}\n` +
            `⚖️ <b>Kanal:</b> @Huquq_study\n\n` +
            `<i>Post to‘liq O‘zbekiston qonunchiligiga binoan AI tomonidan mustaqil tayyorlandi va kanalga joylandi.</i>`
          );

          return { success: true, mode: '2', post: published };
        } catch (pubErr: any) {
          this.logger.error(`[Autopilot Mode 2] Telegramga nashr qilishda xato: ${pubErr.message}`);
          
          await this.telegramService.notifyAdminsDirect(
            `⚠️ <b>[Mode 2: Avtopilot] Telegram nashrida to‘siq!</b>\n\n` +
            `Yangi post tayyorlandi (<b>${post.title}</b>), lekin @Huquq_study kanaliga chiqarishda xatolik yuz berdi:\n` +
            `<code>${pubErr.message}</code>\n\n` +
            `👉 <b>Yechim:</b> Iltimos, Telegramda @Huquq_study kanaliga kiring -> Kanal sozlamalari -> Administratorlar -> <b>@Imomali_lealAid_bot</b> ni administrator qilib qo‘shing va <i>"Xabarlar joylash"</i> ruxsatini bering!`
          );

          return { success: false, mode: '2', error: pubErr.message, post };
        }
      } else {
        // Mode 1: Semi-Autonomous -> Submit for Admin Review
        await this.telegramService.sendPostForReview(post);
        return { success: true, mode: '1', post, message: 'Post admin tasdiqlashiga yuborildi' };
      }
    } catch (err: any) {
      this.logger.error(`[Autopilot] Siklda xatolik: ${err.message}`);
      throw err;
    } finally {
      this.isAutopilotRunning = false;
    }
  }

  // Schedule a post for publishing
  async schedulePost(postId: string, scheduledFor: Date, timezone = 'Asia/Tashkent') {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post topilmadi');

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'SCHEDULED' },
    });

    return this.prisma.scheduledPublication.create({
      data: {
        postId,
        scheduledFor,
        timezone,
      },
    });
  }

  async getScheduledQueue() {
    return this.prisma.scheduledPublication.findMany({
      where: { isExecuted: false },
      include: {
        post: { select: { title: true, type: true, status: true, legalDomain: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async cancelScheduled(id: string) {
    const sp = await this.prisma.scheduledPublication.findUnique({ where: { id } });
    if (sp) {
      await this.prisma.post.update({
        where: { id: sp.postId },
        data: { status: 'APPROVED' },
      });
      await this.prisma.scheduledPublication.delete({ where: { id } });
    }
    return { success: true };
  }
}
