import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private channelId: string;
  private adminIds: string[];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private moduleRef: ModuleRef,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID') || '@Huquq_study';
    const adminsStr = this.configService.get<string>('TELEGRAM_ADMIN_IDS') || '';
    this.adminIds = adminsStr.split(',').map((id) => id.trim()).filter(Boolean);

    if (token) {
      this.bot = new Telegraf(token);
    }
  }

  onModuleInit() {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN ko‘rsatilmagan. Telegram Bot xizmati nofaol.');
      return;
    }

    this.setupBotHandlers();
    // Start bot in polling mode if webhook is not configured
    this.bot.launch().then(() => {
      this.logger.log(`Telegram Bot muvaffaqiyatli ishga tushdi (@Huquq_study yordamchisi)`);
    }).catch((err) => {
      this.logger.error(`Telegram Bot ishga tushirishda xato: ${err.message}`);
    });
  }

  private setupBotHandlers() {
    if (!this.bot) return;

    this.bot.catch((err: any, ctx) => {
      this.logger.error(`Telegram Bot xatosi (${ctx.updateType}): ${err.message}`);
    });

    // /start command
    this.bot.start(async (ctx) => {
      const from = ctx.from;
      // Upsert subscriber
      try {
        await this.prisma.subscriber.upsert({
          where: { telegramId: from.id.toString() },
          update: {
            username: from.username,
            firstName: from.first_name,
            lastName: from.last_name,
            lastActiveAt: new Date(),
          },
          create: {
            telegramId: from.id.toString(),
            username: from.username,
            firstName: from.first_name,
            lastName: from.last_name,
          },
        });
      } catch (e) {
        this.logger.warn(`Subscriber saqlashda xato: ${e.message}`);
      }

      if (this.isAdmin(from.id.toString())) {
        await ctx.reply(
          `👑 <b>Assalomu alaykum, Bosh Administrator (${from.first_name || 'Imomali'})!</b>\n\n` +
          `🤖 <b>LEGAL AID AI</b> — @Huquq_study kanalining Telegram boshqaruv markazidasiz.\n\n` +
          `Endi sayt yoki admin panelga kirmasdan, barcha vazifalarni to‘g‘ridan-to‘g‘ri Telegramdan boshqarasiz:\n\n` +
          `🚀 <b>Darhol Post chiqarish</b> — AI bir lahzada yangi post yaratib kanalga joylaydi\n` +
          `🧠 <b>Viktorina/Test chiqarish</b> — @Huquq_study ga rasmiy huquqiy test so‘rovnomasini chiqaradi\n` +
          `⚖️ <b>Amaliy Kazus chiqarish</b> — Hayotiy kazus va tahlilini chiqaradi\n` +
          `📢 <b>Huquqiy Maqola</b> — Ta'limiy huquqiy maqola chiqaradi\n` +
          `⚙️ <b>Rejim</b> — Mode 1 (Tasdiqlash bilan) yoki Mode 2 (To‘liq Avtopilot)\n` +
          `📊 <b>Statistika</b> — Kanal postlari va obunachilar hisoboti\n\n` +
          `Quyidagi tugmalardan birini tanlang:`,
          {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              ['🚀 Darhol Post chiqarish', '🧠 Viktorina/Test chiqarish'],
              ['⚖️ Amaliy Kazus chiqarish', '📢 Huquqiy Maqola'],
              ['⏰ Vaqt jadvali (Cron)', '🏆 Haftalik 5 talik Quiz'],
              ['⚙️ Rejim (Mode 1 / Mode 2)', '📊 Kanal Statistikasi'],
            ]).resize(),
          },
        );
        return;
      }

      await ctx.reply(
        `Assalomu alaykum, <b>${from.first_name || 'foydalanuvchi'}</b>!\n\n` +
        `🤖 <b>LEGAL AID AI</b> — O‘zbekiston huquqiy ta'limi va @Huquq_study kanalining rasmiy yordamchi botiga xush kelibsiz!\n\n` +
        `📚 Bu yerda siz:\n` +
        `• Huquqiy yangiliklar bilan tanishishingiz (/news)\n` +
        `• O‘z huquqiy savollaringizni berishingiz (/ask)\n` +
        `• Huquqiy testlarda bilimingizni sinashingiz (/quiz)\n` +
        `• Bot haqida ma'lumot olishingiz mumkin (/about)\n\n` +
        `Quyidagi tugmalardan birini tanlang yoki buyruq yuboring:`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            ['📢 So‘nggi yangiliklar', '❓ Savol berish'],
            ['🧠 Viktorina', 'ℹ️ Bot haqida'],
          ]).resize(),
        },
      );
    });

    // /help command
    this.bot.help((ctx) => {
      ctx.reply(
        `📋 <b>Mavjud buyruqlar ro‘yxati:</b>\n\n` +
        `/start - Botni qayta ishga tushirish\n` +
        `/news - Eng so‘nggi tasdiqlangan qonun yangiliklari\n` +
        `/ask [savolingiz] - Yuridik savol yo‘llash\n` +
        `/quiz - Huquqiy testni yechish\n` +
        `/about - Kanal va loyiha haqida ma'lumot\n\n` +
        (this.isAdmin(ctx.from.id.toString())
          ? `👑 <b>Administrator buyruqlari:</b>\n/admin - Admin panel\n/pending - Tasdiqlash navbati\n/stats - Statistika`
          : ''),
        { parse_mode: 'HTML' },
      );
    });

    // /about command
    this.bot.command('about', (ctx) => {
      ctx.reply(
        `🏛 <b>LEGAL AID AI</b> — O‘zbekiston Respublikasi huquqiy savodxonligini oshirishga yo‘naltirilgan intellektual platforma.\n\n` +
        `Kanalimiz: @Huquq_study\n` +
        `Rasmiy manba: Lex.uz milliy qonunchilik bazasi.\n` +
        `Rejim: Yarim-avtonom (Semi-autonomous) — AI tayyorlaydi, yuristlar tasdiqlaydi!`,
        { parse_mode: 'HTML' },
      );
    });

    // /news command
    this.bot.command('news', async (ctx) => {
      const posts = await this.prisma.post.findMany({
        where: { type: 'NEWS', status: 'PUBLISHED' },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      });

      if (posts.length === 0) {
        return ctx.reply('Hozircha nashr etilgan yangiliklar mavjud emas.');
      }

      for (const p of posts) {
        await ctx.reply(
          `📢 <b>${p.title}</b>\n\n${p.summary || p.content.slice(0, 300)}...\n\nKanalda o‘qish: ${this.channelId}`,
          { parse_mode: 'HTML' },
        );
      }
    });

    // /ask command
    this.bot.command('ask', async (ctx) => {
      const text = ctx.message.text.replace('/ask', '').trim();
      if (!text) {
        return ctx.reply('Iltimos, savolingizni buyruqdan so‘ng yozing.\nMisol: <code>/ask Ta\'til kunlari qanday hisoblanadi?</code>', {
          parse_mode: 'HTML',
        });
      }

      const subscriber = await this.prisma.subscriber.findUnique({
        where: { telegramId: ctx.from.id.toString() },
      });

      if (!subscriber) {
        return ctx.reply('Iltimos, avval /start buyrug‘ini bosing.');
      }

      const question = await this.prisma.subscriberQuestion.create({
        data: {
          subscriberId: subscriber.id,
          questionText: text,
          responseStatus: 'RECEIVED',
        },
      });

      await ctx.reply(
        `✅ Savolingiz qabul qilindi!\n\nAI ekspertimiz O‘zbekiston qonunchiligiga binoan javob tayyorlamoqda va yurist ko‘rib chiqqach sizga yuboriladi.`,
      );

      // Notify Admins
      this.notifyAdminsAboutQuestion(question.id, text, ctx.from.first_name);
    });

    // Admin /mode command to inspect or switch autonomous modes
    this.bot.command('mode', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) {
        return ctx.reply('Kechirasiz, sizda ushbu buyruqni bajarish huquqi yo‘q.');
      }

      let currentMode = '2';
      try {
        const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'AUTONOMOUS_MODE' } });
        if (setting && setting.value) currentMode = setting.value;
      } catch (_) {}

      await ctx.reply(
        `⚙️ <b>LEGAL AID AI — Avtonom Rejim Sozlamasi</b>\n\n` +
        `Joriy rejim: <b>Mode ${currentMode}</b> (${currentMode === '2' ? '🚀 To‘liq Avtopilot' : '🛡 Yarim-avtonom'})\n\n` +
        `• <b>Mode 1 (Yarim-avtonom):</b> AI postlarni tayyorlaydi, lekin Telegram kanalga chiqishdan oldin admin (siz) tasdiqlashingiz kerak.\n` +
        `• <b>Mode 2 (To‘liq Avtopilot):</b> AI postlarni to‘liq mustaqil yaratadi, tekshiradi va to‘g‘ridan-to‘g‘ri @Huquq_study kanaliga avtomatik nashr qiladi!\n\n` +
        `Kerakli rejimni tanlang:`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                currentMode === '1' ? '🔘 Mode 1 (Tanlangan)' : '⚪️ Mode 1 ga o‘tish',
                'set_mode_1'
              ),
              Markup.button.callback(
                currentMode === '2' ? '🔘 Mode 2 (Tanlangan)' : '🚀 Mode 2 ga o‘tish',
                'set_mode_2'
              ),
            ],
          ]),
        }
      );
    });

    // Handle Mode change callbacks
    this.bot.action('set_mode_1', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return;
      await this.prisma.systemSetting.upsert({
        where: { key: 'AUTONOMOUS_MODE' },
        update: { value: '1', description: 'Yarim-avtonom (Tasdiqlash bilan)' },
        create: { key: 'AUTONOMOUS_MODE', value: '1', category: 'automation', description: 'Yarim-avtonom (Tasdiqlash bilan)' },
      });
      await ctx.answerCbQuery('Mode 1 (Yarim-avtonom) tanlandi');
      await ctx.editMessageText('🛡 <b>Rejim o‘zgartirildi: Mode 1 (Yarim-avtonom).</b>\n\nEndi yangi postlar kanalga chiqishidan oldin sizning tasdiqlashingizni kutadi.', { parse_mode: 'HTML' });
    });

    this.bot.action('set_mode_2', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return;
      await this.prisma.systemSetting.upsert({
        where: { key: 'AUTONOMOUS_MODE' },
        update: { value: '2', description: 'To‘liq Avtopilot (Avtomatik nashr)' },
        create: { key: 'AUTONOMOUS_MODE', value: '2', category: 'automation', description: 'To‘liq Avtopilot (Avtomatik nashr)' },
      });
      await ctx.answerCbQuery('Mode 2 (To‘liq Avtopilot) faollashtirildi!');
      await ctx.editMessageText('🚀 <b>Rejim o‘zgartirildi: Mode 2 (To‘liq Avtopilot).</b>\n\nAI kontentni mustaqil tayyorlaydi va to‘g‘ridan-to‘g‘ri @Huquq_study kanaliga avtomatik nashr etadi!', { parse_mode: 'HTML' });
    });

    // Admin /pending command
    this.bot.command('pending', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) {
        return ctx.reply('Kechirasiz, sizda ushbu buyruqni bajarish huquqi yo‘q.');
      }

      const pending = await this.prisma.post.findMany({
        where: { status: 'PENDING_APPROVAL' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      if (pending.length === 0) {
        return ctx.reply('🎉 Tasdiqlash navbatida hech qanday post yo‘q.');
      }

      for (const p of pending) {
        await ctx.reply(
          `📝 <b>Kutilayotgan post:</b> [${p.type}]\n\n<b>${p.title}</b>\n\n${p.content.slice(0, 400)}...`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(`✅ Tasdiqlash`, `approve_${p.id}`),
                Markup.button.callback(`❌ Rad etish`, `reject_${p.id}`),
              ],
            ]),
          },
        );
      }
    });

    // Handle Inline Approvals from Telegram
    this.bot.action(/^approve_(.+)$/, async (ctx) => {
      const postId = ctx.match[1];
      if (!this.isAdmin(ctx.from.id.toString())) {
        return ctx.answerCbQuery('Ruxsat etilmagan!', { show_alert: true });
      }

      try {
        await this.prisma.post.update({
          where: { id: postId },
          data: { status: 'APPROVED' },
        });

        await ctx.answerCbQuery('Post tasdiqlandi!');
        await ctx.editMessageText(`✅ <b>Post muvaffaqiyatli tasdiqlandi!</b> Endi uni kanalga nashr qilish yoki rejalashtirish mumkin.`, {
          parse_mode: 'HTML',
        });
      } catch (e) {
        await ctx.answerCbQuery(`Xato: ${e.message}`, { show_alert: true });
      }
    });

    // Handle Inline Rejections from Telegram
    this.bot.action(/^reject_(.+)$/, async (ctx) => {
      const postId = ctx.match[1];
      if (!this.isAdmin(ctx.from.id.toString())) {
        return ctx.answerCbQuery('Ruxsat etilmagan!', { show_alert: true });
      }

      try {
        await this.prisma.post.update({
          where: { id: postId },
          data: { status: 'REJECTED' },
        });

        await ctx.answerCbQuery('Post rad etildi!');
        await ctx.editMessageText(`❌ <b>Post rad etildi.</b>`, { parse_mode: 'HTML' });
      } catch (e) {
        await ctx.answerCbQuery(`Xato: ${e.message}`, { show_alert: true });
      }
    });

    // Handle Cron / Schedule Actions
    this.bot.action('cron_menu', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return;
      await this.showCronManager(ctx, true);
    });

    this.bot.action('cron_toggle_enabled', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return;
      const { SchedulerService } = await import('../scheduler/scheduler.service');
      const scheduler = this.moduleRef.get(SchedulerService, { strict: false });
      const current = await scheduler.getScheduleSettings();
      await scheduler.updateScheduleSettings({ isEnabled: !current.isEnabled });
      await ctx.answerCbQuery(!current.isEnabled ? 'Jadval yoqildi ✅' : 'Jadval to‘xtatildi ⏸');
      await this.showCronManager(ctx, true);
    });

    this.bot.action(/^cron_edit_(morning|lunch|evening|blitz)$/, async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return;
      const type = ctx.match[1];
      const titles: Record<string, string> = {
        morning: '🌅 Ertalabki maqola',
        lunch: '☀️ Tushlik viktorinasi',
        evening: '🌙 Kechki amaliy kazus',
        blitz: '🏆 Yakshanba 5 talik blits',
      };

      const options: Record<string, string[]> = {
        morning: ['08:00', '08:30', '09:00', '09:30', '10:00'],
        lunch: ['12:00', '12:30', '13:00', '13:30', '14:00'],
        evening: ['19:00', '19:30', '20:00', '20:30', '21:00'],
        blitz: ['18:00', '19:00', '20:00', '20:30', '21:00'],
      };

      const buttons = (options[type] || []).map((t) =>
        Markup.button.callback(t, `cron_set_${type}_${t}`)
      );

      const keyboard = [];
      for (let i = 0; i < buttons.length; i += 3) {
        keyboard.push(buttons.slice(i, i + 3));
      }
      keyboard.push([Markup.button.callback('⬅️ Orqaga', 'cron_menu')]);

      await ctx.editMessageText(
        `⚙️ <b>${titles[type]} vaqtini tanlang:</b>\n\n` +
        `Quyidagi vaqtlardan birini bosing yoki o‘zingiz istagan vaqtni yozing:\n` +
        `Misol: <code>/set_time ${type} 08:45</code>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(keyboard),
        }
      );
    });

    this.bot.action(/^cron_set_(morning|lunch|evening|blitz)_(.+)$/, async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return;
      const type = ctx.match[1];
      const time = ctx.match[2];

      const { SchedulerService } = await import('../scheduler/scheduler.service');
      const scheduler = this.moduleRef.get(SchedulerService, { strict: false });

      if (type === 'morning') await scheduler.updateScheduleSettings({ morningTime: time });
      if (type === 'lunch') await scheduler.updateScheduleSettings({ lunchTime: time });
      if (type === 'evening') await scheduler.updateScheduleSettings({ eveningTime: time });
      if (type === 'blitz') await scheduler.updateScheduleSettings({ sundayBlitzTime: time });

      await ctx.answerCbQuery(`Vaqt ${time} ga o‘zgartirildi!`);
      await this.showCronManager(ctx, true);
    });

    // Admin /post and /autopost commands
    this.bot.command(['post', 'autopost'], async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      await this.triggerAutopilotFromTelegram(ctx);
    });

    // Admin /case command
    this.bot.command('case', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      await this.triggerAutopilotFromTelegram(ctx, 'CASE_STUDY');
    });

    // Admin /article command
    this.bot.command('article', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      await this.triggerAutopilotFromTelegram(ctx, 'EDUCATIONAL');
    });

    // Admin /stats command
    this.bot.command('stats', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      await this.showStatsToAdmin(ctx);
    });

    // Admin /blitz and /weekly commands
    this.bot.command(['blitz', 'weekly'], async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      await this.triggerWeeklyQuizFromTelegram(ctx);
    });

    // Admin /schedule, /cron, /time commands
    this.bot.command(['schedule', 'cron', 'time', 'vaqt'], async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      await this.showCronManager(ctx);
    });

    // Admin /set_time command (e.g. /set_time ertalab 08:30)
    this.bot.command('set_time', async (ctx) => {
      if (!this.isAdmin(ctx.from.id.toString())) return ctx.reply('Ruxsat etilmagan.');
      const parts = ctx.message.text.split(' ').slice(1);
      if (parts.length < 2) {
        return ctx.reply(
          `ℹ️ <b>Format:</b> <code>/set_time [turi] [HH:mm]</code>\n\n` +
          `Misollar:\n` +
          `• <code>/set_time ertalab 08:30</code>\n` +
          `• <code>/set_time tushlik 12:45</code>\n` +
          `• <code>/set_time kechki 21:00</code>\n` +
          `• <code>/set_time yakshanba 20:00</code>`,
          { parse_mode: 'HTML' }
        );
      }

      const [type, time] = parts;
      if (!time.match(/^([01]\d|2[0-3]):[0-5]\d$/)) {
        return ctx.reply('⚠️ Noto‘g‘ri vaqt formati. Format <code>HH:mm</code> (masalan <code>08:30</code>) bo‘lishi kerak.', { parse_mode: 'HTML' });
      }

      const { SchedulerService } = await import('../scheduler/scheduler.service');
      const scheduler = this.moduleRef.get(SchedulerService, { strict: false });

      if (type.includes('erta')) {
        await scheduler.updateScheduleSettings({ morningTime: time });
        return ctx.reply(`✅ 🌅 <b>Ertalabki post vaqti ${time} ga o‘zgartirildi!</b>`, { parse_mode: 'HTML' });
      } else if (type.includes('tush')) {
        await scheduler.updateScheduleSettings({ lunchTime: time });
        return ctx.reply(`✅ ☀️ <b>Tushlikdagi viktorina vaqti ${time} ga o‘zgartirildi!</b>`, { parse_mode: 'HTML' });
      } else if (type.includes('kech')) {
        await scheduler.updateScheduleSettings({ eveningTime: time });
        return ctx.reply(`✅ 🌙 <b>Kechki kazus vaqti ${time} ga o‘zgartirildi!</b>`, { parse_mode: 'HTML' });
      } else if (type.includes('yakshanba') || type.includes('blitz')) {
        await scheduler.updateScheduleSettings({ sundayBlitzTime: time });
        return ctx.reply(`✅ 🏆 <b>Yakshanba 5 talik blits vaqti ${time} ga o‘zgartirildi!</b>`, { parse_mode: 'HTML' });
      } else {
        return ctx.reply('⚠️ Noma’lum tur. (ertalab, tushlik, kechki, yakshanba)', { parse_mode: 'HTML' });
      }
    });

    // Text messages routing
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;

      // Admin interactive buttons
      if (this.isAdmin(ctx.from.id.toString())) {
        if (text === '🚀 Darhol Post chiqarish') {
          return this.triggerAutopilotFromTelegram(ctx);
        }
        if (text === '🧠 Viktorina/Test chiqarish') {
          return this.triggerAutopilotFromTelegram(ctx, 'QUIZ');
        }
        if (text === '⚖️ Amaliy Kazus chiqarish') {
          return this.triggerAutopilotFromTelegram(ctx, 'CASE_STUDY');
        }
        if (text === '📢 Huquqiy Maqola') {
          return this.triggerAutopilotFromTelegram(ctx, 'EDUCATIONAL');
        }
        if (text === '🏆 Haftalik 5 talik Quiz') {
          return this.triggerWeeklyQuizFromTelegram(ctx);
        }
        if (text === '⏰ Vaqt jadvali (Cron)') {
          return this.showCronManager(ctx);
        }
        if (text === '⚙️ Rejim (Mode 1 / Mode 2)') {
          return this.showModeSelector(ctx);
        }
        if (text === '📊 Kanal Statistikasi') {
          return this.showStatsToAdmin(ctx);
        }
        if (text === '📝 Tasdiqlash navbati') {
          return this.showPendingQueue(ctx);
        }
      }

      if (text === '📢 So‘nggi yangiliklar') {
        return ctx.telegram.sendMessage(ctx.chat.id, 'Eng so‘nggi yangiliklar uchun /news buyrug‘idan foydalaning.');
      } else if (text === '❓ Savol berish') {
        return ctx.reply('Huquqiy savolingizni yo‘llash uchun:\n<code>/ask [savolingiz]</code> formatida yozing.', { parse_mode: 'HTML' });
      } else if (text === '🧠 Viktorina') {
        return ctx.reply('Huquqiy viktorina qatnashish uchun /quiz buyrug‘ini bosing.');
      } else if (text === 'ℹ️ Bot haqida') {
        return ctx.reply('Loyiha haqida: /about');
      }
    });
  }

  private async showModeSelector(ctx: any) {
    let currentMode = '2';
    try {
      const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'AUTONOMOUS_MODE' } });
      if (setting && setting.value) currentMode = setting.value;
    } catch (_) {}

    await ctx.reply(
      `⚙️ <b>LEGAL AID AI — Avtonom Rejim Sozlamasi</b>\n\n` +
      `Joriy rejim: <b>Mode ${currentMode}</b> (${currentMode === '2' ? '🚀 To‘liq Avtopilot' : '🛡 Yarim-avtonom'})\n\n` +
      `• <b>Mode 1:</b> Postlar oldin adminga keladi va faqat siz "Tasdiqlash" tugmasini bosgach kanalga chiqadi.\n` +
      `• <b>Mode 2:</b> AI postlarni avtomatik tayyorlaydi va darhol @Huquq_study kanaliga e'lon qiladi!\n\n` +
      `Rejimni tanlang:`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              currentMode === '1' ? '🔘 Mode 1 (Faol)' : '⚪️ Mode 1 ga o‘tish',
              'set_mode_1'
            ),
            Markup.button.callback(
              currentMode === '2' ? '🔘 Mode 2 (Faol)' : '🚀 Mode 2 ga o‘tish',
              'set_mode_2'
            ),
          ],
        ]),
      }
    );
  }

  private async showStatsToAdmin(ctx: any) {
    try {
      const totalPosts = await this.prisma.post.count();
      const publishedPosts = await this.prisma.post.count({ where: { status: 'PUBLISHED' } });
      const pendingPosts = await this.prisma.post.count({ where: { status: 'PENDING_APPROVAL' } });
      const subscribersCount = await this.prisma.subscriber.count();
      const questionsCount = await this.prisma.subscriberQuestion.count();

      await ctx.reply(
        `📊 <b>LEGAL AID AI — Kanal va Tizim Statistikasi</b>\n\n` +
        `⚖️ <b>Telegram Kanal:</b> @Huquq_study\n` +
        `📝 <b>Jami yaratilgan postlar:</b> ${totalPosts} ta\n` +
        `📢 <b>Kanalga nashr etilgan:</b> ${publishedPosts} ta\n` +
        `⏳ <b>Tasdiqlash kutilayotgan:</b> ${pendingPosts} ta\n` +
        `👥 <b>Bot foydalanuvchilari:</b> ${subscribersCount} ta\n` +
        `❓ <b>Foydalanuvchilar savollari:</b> ${questionsCount} ta`,
        { parse_mode: 'HTML' }
      );
    } catch (e: any) {
      await ctx.reply(`Statistikani yuklashda xato: ${e.message}`);
    }
  }

  private async showPendingQueue(ctx: any) {
    const pending = await this.prisma.post.findMany({
      where: { status: 'PENDING_APPROVAL' },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (pending.length === 0) {
      return ctx.reply('🎉 Tasdiqlash navbatida kutilayotgan postlar yo‘q. Barcha postlar tasdiqlangan!');
    }

    for (const p of pending) {
      await ctx.reply(
        `📝 <b>Kutilayotgan post:</b> [${p.type}]\n\n<b>${p.title}</b>\n\n${p.content.slice(0, 400)}...`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(`✅ Tasdiqlash`, `approve_${p.id}`),
              Markup.button.callback(`❌ Rad etish`, `reject_${p.id}`),
            ],
          ]),
        },
      );
    }
  }

  private async showCronManager(ctx: any, isEdit = false) {
    try {
      const { SchedulerService } = await import('../scheduler/scheduler.service');
      const scheduler = this.moduleRef.get(SchedulerService, { strict: false });
      const s = await scheduler.getScheduleSettings();

      const text = (
        `⏰ <b>LEGAL AID AI — Post chiqarish vaqt jadvali (Cron)</b>\n\n` +
        `O‘zbekiston (Toshkent) vaqti bo‘yicha avtomatik nashr soatlari:\n\n` +
        `🌅 <b>Ertalabki maqola:</b> <code>${s.morningTime}</code>\n` +
        `☀️ <b>Tushlik viktorinasi:</b> <code>${s.lunchTime}</code>\n` +
        `🌙 <b>Kechki amaliy kazus:</b> <code>${s.eveningTime}</code>\n` +
        `🏆 <b>Yakshanba 5 talik blits:</b> <code>${s.sundayBlitzTime}</code>\n\n` +
        `Holati: <b>${s.isEnabled ? 'FAOL (Yoniq) ✅' : 'TO‘XTATILGAN ⏸'}</b>\n\n` +
        `<i>O‘zgartirmoqchi bo‘lgan muddat tugmasini bosing:</i>`
      );

      const buttons = [
        [
          Markup.button.callback(`🌅 Ertalab (${s.morningTime})`, 'cron_edit_morning'),
          Markup.button.callback(`☀️ Tushlik (${s.lunchTime})`, 'cron_edit_lunch'),
        ],
        [
          Markup.button.callback(`🌙 Kechki (${s.eveningTime})`, 'cron_edit_evening'),
          Markup.button.callback(`🏆 Yakshanba (${s.sundayBlitzTime})`, 'cron_edit_blitz'),
        ],
        [
          Markup.button.callback(
            s.isEnabled ? '⏸ Jadvalni to‘xtatish' : '▶️ Jadvalni yoqish',
            'cron_toggle_enabled'
          ),
        ],
      ];

      if (isEdit && ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      } else {
        await ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e: any) {
      await ctx.reply(`Jadvalni yuklashda xato: ${e.message}`);
    }
  }

  private async triggerAutopilotFromTelegram(ctx: any, type?: 'QUIZ' | 'CASE_STUDY' | 'EDUCATIONAL') {
    const statusMsg = await ctx.reply('⏳ <b>AI yangi qonunchilik kontentini tayyorlamoqda...</b>', { parse_mode: 'HTML' });
    try {
      const { SchedulerService } = await import('../scheduler/scheduler.service');
      const scheduler = this.moduleRef.get(SchedulerService, { strict: false });
      const res = await scheduler.runAutopilotCycle(type);

      if (res.success && res.mode === '2') {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          undefined,
          `🚀 <b>Muvaffaqiyatli nashr etildi!</b>\n\n` +
          `📌 <b>Sarlavha:</b> ${res.post?.title || 'Yangi post'}\n` +
          `🏷 <b>Turi:</b> ${res.post?.type}\n` +
          `⚖️ <b>Kanal:</b> @Huquq_study\n\n` +
          `Post to‘g‘ridan-to‘g‘ri kanalga joylandi!`,
          { parse_mode: 'HTML' }
        );
      } else if (res.success && res.mode === '1') {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          undefined,
          `📝 <b>Post tayyorlandi (Mode 1)!</b>\n\nTasdiqlash uchun adminga yuborildi.`,
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          undefined,
          `⚠️ <b>Xatolik:</b> ${res.error || 'Nomaʼlum xatolik'}`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (e: any) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        `❌ <b>Xatolik yuz berdi:</b> ${e.message}`,
        { parse_mode: 'HTML' }
      );
    }
  }

  private async triggerWeeklyQuizFromTelegram(ctx: any) {
    const statusMsg = await ctx.reply('⏳ <b>Haftalik 5 talik Quiz blitsi tayyorlanmoqda va kanalga yuklanmoqda...</b>', { parse_mode: 'HTML' });
    try {
      const { SchedulerService } = await import('../scheduler/scheduler.service');
      const scheduler = this.moduleRef.get(SchedulerService, { strict: false });
      await scheduler.runSundayWeeklyQuizBlitz();
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        `🏆 <b>Muvaffaqiyatli!</b>\n\n5 talik haftalik huquqiy test blitsi @Huquq_study kanaliga chiqarildi!`,
        { parse_mode: 'HTML' },
      );
    } catch (e: any) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        `❌ <b>Xatolik yuz berdi:</b> ${e.message}`,
        { parse_mode: 'HTML' },
      );
    }
  }

  private isAdmin(telegramId: string): boolean {
    return this.adminIds.includes(telegramId);
  }

  async notifyAdminsDirect(message: string) {
    if (!this.bot || this.adminIds.length === 0) return;

    for (const adminId of this.adminIds) {
      try {
        await this.bot.telegram.sendMessage(adminId, message, {
          parse_mode: 'HTML',
        });
      } catch (err: any) {
        this.logger.warn(`Adminga to‘g‘ridan-to‘g‘ri bildirishnoma yuborishda xato (${adminId}): ${err.message}`);
      }
    }
  }

  async sendPostForReview(post: any) {
    if (!this.bot || this.adminIds.length === 0) return;

    for (const adminId of this.adminIds) {
      try {
        await this.bot.telegram.sendMessage(
          adminId,
          `🔔 <b>Yangi post ko‘rib chiqish uchun keldi:</b>\n\nTuri: <b>${post.type}</b>\nSarlavha: <b>${post.title}</b>\n\n${post.content.slice(0, 600)}...`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(`✅ Tasdiqlash`, `approve_${post.id}`),
                Markup.button.callback(`❌ Rad etish`, `reject_${post.id}`),
              ],
            ]),
          },
        );
      } catch (err) {
        this.logger.warn(`Adminga xabar yuborishda xato (${adminId}): ${err.message}`);
      }
    }
  }

  private async notifyAdminsAboutQuestion(questionId: string, questionText: string, senderName: string) {
    if (!this.bot || this.adminIds.length === 0) return;

    for (const adminId of this.adminIds) {
      try {
        await this.bot.telegram.sendMessage(
          adminId,
          `❓ <b>Yangi obunachi savoli keldi!</b>\n\nKimdan: <b>${senderName || 'Foydalanuvchi'}</b>\nSavol: "${questionText}"\n\nAdmin panelda javobni tasdiqlang.`,
          { parse_mode: 'HTML' },
        );
      } catch (err) {
        this.logger.warn(`Adminga savol bildirishnomasini yuborishda xato: ${err.message}`);
      }
    }
  }
}
