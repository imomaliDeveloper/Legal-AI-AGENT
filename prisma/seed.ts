import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Boshlang‘ich ma\'lumotlar kiritilmoqda...');

  // 1. Seed Default Admin User
  const adminPasswordHash = await bcrypt.hash('admin12345', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@legalaid.uz' },
    update: {},
    create: {
      email: 'admin@legalaid.uz',
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'Bosh Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin foydalanuvchi tayyor: admin@legalaid.uz (Parol: admin12345)`);

  // 2. Seed Primary Legal Source: Lex.uz
  const lexSource = await prisma.legalSource.upsert({
    where: { baseUrl: 'https://lex.uz' },
    update: {},
    create: {
      name: 'Lex.uz - O‘zbekiston Respublikasi Qonunchilik ma’lumotlari milliy bazasi',
      baseUrl: 'https://lex.uz',
      type: 'OFFICIAL',
      priority: 1,
      isActive: true,
      description: 'O‘zbekiston Respublikasi rasmiy normativ-huquqiy hujjatlari milliy bazasi',
    },
  });
  console.log(`✅ Asosiy qonun manbasi yaratildi: ${lexSource.name}`);

  // 3. Seed sample educational article
  const post = await prisma.post.upsert({
    where: { slug: 'mehnat-shartnomasi-kafolatlari-2026' },
    update: {},
    create: {
      title: 'Yangi Mehnat kodeksida xodimlar uchun kafolatlar',
      slug: 'mehnat-shartnomasi-kafolatlari-2026',
      summary: 'Yangi Mehnat kodeksi bo‘yicha ishga qabul qilish va kafolatlar tahlili.',
      content: `📢 Yangi Mehnat kodeksida xodimlar uchun qanday yangi kafolatlar belgilangan?\n\nO‘zbekiston Respublikasining yangi tahrirdagi Mehnat kodeksiga muvofiq, xodimning mehnat huquqlari yanada mustahkamlandi. Sinov muddati, ta'tillar va masofaviy ishlash bo‘yicha yangi normalar joriy etildi.\n\n⚖️ Rasmiy manba: Lex.uz\nKanal: @Huquq_study`,
      type: 'EDUCATIONAL_ARTICLE',
      status: 'APPROVED',
      legalDomain: 'LABOR',
      authorId: admin.id,
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
  });
  console.log(`✅ Namunaviy post tasdiqlandi: "${post.title}" (Status: APPROVED)`);

  console.log('🎉 Barcha boshlang‘ich ma\'lumotlar muvaffaqiyatli saqlandi!');
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
