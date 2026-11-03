import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root or current folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@Huquq_study';
const API_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN topilmadi! .env faylni tekshiring.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

console.log('🤖 LEGAL AID AI Telegram Bot ishga tushirilmoqda...');

bot.start(async (ctx) => {
  const from = ctx.from;
  await ctx.reply(
    `Assalomu alaykum, <b>${from.first_name || 'foydalanuvchi'}</b>!\n\n` +
    `🤖 <b>LEGAL AID AI</b> — O‘zbekiston huquqiy ta'limi va ${CHANNEL_ID} kanalining rasmiy yordamchi botiga xush kelibsiz!\n\n` +
    `Quyidagi buyruqlardan foydalanishingiz mumkin:\n` +
    `• /news - Eng so‘nggi qonunchilik yangiliklari\n` +
    `• /ask [savol] - Yuridik savol yo‘llash\n` +
    `• /quiz - Huquqiy viktorinada qatnashish\n` +
    `• /about - Loyiha haqida ma'lumot`,
    {
      parse_mode: 'HTML',
      ...Markup.keyboard([
        ['📢 So‘nggi yangiliklar', '❓ Savol berish'],
        ['🧠 Viktorina', 'ℹ️ Bot haqida'],
      ]).resize(),
    },
  );
});

bot.help((ctx) => {
  ctx.reply(
    `📋 <b>Buyruqlar:</b>\n\n` +
    `/start - Botni ishga tushirish\n` +
    `/news - Yangiliklar\n` +
    `/ask [savol] - Savol berish\n` +
    `/quiz - Viktorina\n` +
    `/about - Loyiha haqida\n\n` +
    (ADMIN_IDS.includes(ctx.from.id.toString())
      ? `👑 <b>Admin:</b> /pending, /stats`
      : ''),
    { parse_mode: 'HTML' },
  );
});

bot.command('about', (ctx) => {
  ctx.reply(
    `🏛 <b>LEGAL AID AI</b>\n` +
    `O‘zbekiston Respublikasi huquqiy axborot va ta'lim kanali boshqaruv platformasi.\n` +
    `Kanal: ${CHANNEL_ID}\n` +
    `Rasmiy manba: Lex.uz milliy qonunchilik bazasi.`,
    { parse_mode: 'HTML' },
  );
});

bot.command('news', async (ctx) => {
  try {
    const res = await axios.get(`${API_URL}/posts?type=NEWS&status=PUBLISHED&limit=3`);
    const posts = res.data?.data?.items || [];
    if (posts.length === 0) {
      return ctx.reply('Hozircha nashr etilgan yangiliklar mavjud emas.');
    }
    for (const p of posts) {
      await ctx.reply(`📢 *${p.title}*\n\n${p.summary || p.content.slice(0, 300)}...`, { parse_mode: 'Markdown' });
    }
  } catch (err: any) {
    ctx.reply('Yangiliklarni olishda xatolik yuz berdi. API server ishlamayotgan bo‘lishi mumkin.');
  }
});

bot.command('ask', async (ctx) => {
  const text = ctx.message.text.replace('/ask', '').trim();
  if (!text) {
    return ctx.reply('Iltimos savolingizni quyidagicha yozing:\n`/ask Mehnat ta\'tili qanday hisoblanadi?`', { parse_mode: 'Markdown' });
  }

  ctx.reply('✅ Savolingiz qabul qilindi! AI ekspert tahlil qilib, yurist ko‘rib chiqqach javob yuboriladi.');
});

bot.launch().then(() => {
  console.log(`✅ LEGAL AID AI Bot muvaffaqiyatli ishga tushdi! Kanal: ${CHANNEL_ID}`);
}).catch((err) => {
  console.error('❌ Botni ishga tushirishda xato:', err.message);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
