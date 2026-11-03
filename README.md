# 🏛️ LEGAL AID AI
## Autonomous Legal Intelligence & Telegram Media Management Platform

**O‘zbekiston huquqiy axborot va ta'lim kanali ([@Huquq_study](https://t.me/Huquq_study)) uchun yarim-avtonom sun'iy intellekt platformasi.**

Ushbu platforma O‘zbekiston Respublikasi qonunchiligi (asosiy manba: [Lex.uz](https://lex.uz/)) asosida huquqiy yangiliklar, ta'limiy maqolalar, amaliy kazuslar va testlarni generatsiya qiladi, inson-administrator nazorati orqali tasdiqlaydi va Telegram kanaliga reja asosida nashr etadi.

---

## ⚡ Asosiy Ish Prinsiplari (Semi-Autonomous Workflow)

1. **DISCOVERED** — Lex.uz va boshqa rasmiy manbalardan yangi qonun va qarorlar aniqlanadi.
2. **RESEARCHED** — Qonun kuchi, sanasi va moddalari tekshiriladi (Amaldagi va bekor qilinganlar farqlanadi).
3. **DRAFT** — AI agentlari (News, Education, Case, Quiz) O‘zbek tilida (Lotin yozuvida) qoralama tayyorlaydi.
4. **VERIFIED** — Huquqiy asoslar tekshiriladi.
5. **PENDING_APPROVAL** — Qoralama administrator ko‘rib chiqishi uchun yuboriladi (Telegram bot inline tugmalari yoki Admin panel orqali).
6. **APPROVED** — Faqat vakolatli administrator tasdiqlagan kontent.
7. **SCHEDULED** — Belgilangan vaqtga rejalashtiriladi (Toshkent vaqti: 08:00 Yangilik, 12:00 Maqola, 16:00 Kazus, 19:00 Viktorina).
8. **PUBLISHED** — @Huquq_study kanaliga e'lon qilinadi (Matn yoki Telegram Quiz Poll ko‘rinishida).

> ⚠️ **Qat'iy xavfsizlik qoidasi:** AI hech qachon inson tasdig'isiz to‘g‘ridan-to‘g‘ri kanalga post chiqarmaydi!

---

## 🛠 Texnologiyalar Steki

| Qism | Texnologiya |
|---|---|
| **Backend** | Node.js, NestJS (Modular Architecture), TypeScript |
| **Ma'lumotlar bazasi** | PostgreSQL, Prisma ORM (19+ modellar) |
| **Navbat & Rejalashtiruvchi** | Redis, BullMQ, NestJS Scheduler (Asia/Tashkent) |
| **Telegram Integratsiyasi** | Telegraf v4 (Rasmiy Telegram Bot API) |
| **AI Provayderlari** | Google Gemini API & Anthropic Claude API (Provider-Independent Abstraction) |
| **Frontend / Dashboard** | Next.js 14, React 18, Tailwind CSS, Lucide Icons |
| **Infratuzilma** | Docker, Docker Compose, Winston structured logs |

---

## 📂 Loyiha Strukturasi (Monorepo)

```
legal-aid-ai/
  ├── apps/
  │   ├── api/                   # NestJS REST API (17 ta modul)
  │   ├── admin/                 # Next.js 14 Responsive Admin Dashboard
  │   └── telegram-bot/          # Mustaqil Telegraf Bot servisi
  ├── packages/
  │   ├── shared/                # Umumiy turlar, DTOlar (Zod), konstantalar, yordamchilar
  │   ├── ai/                    # Gemini & Claude AI provayder abstraksiyasi
  │   └── legal-research/        # Lex.uz qidiruv, manbalar reestri, hujjat tahlili
  ├── prisma/
  │   └── schema.prisma          # PostgreSQL to‘liq relyatsion sxemasi (19+ model)
  ├── infrastructure/
  │   └── docker/                # Dockerfile.api, Dockerfile.admin, Dockerfile.bot
  ├── docs/                      # Spetsifikatsiya, Arxitektura, Reja hujjatlari
  ├── docker-compose.yml
  ├── .env.example
  └── package.json
```

---

## 🚀 O‘rnatish va Ishga Tushirish (PowerShell)

### 1. Bog'liqliklarni o‘rnatish

```powershell
npm install
```

### 2. Paketlarni kompilyatsiya qilish

```powershell
npm run build -w packages/shared
npm run build -w packages/ai
npm run build -w packages/legal-research
```

### 3. Prisma Client yaratish

```powershell
npm run db:generate
```

### 4. Sozlamalarni kiritish (.env)

```powershell
Copy-Item .env.example .env
# .env faylini ochib, API kalitlari va Telegram bot tokenini kiriting
```

### 5. Sinovlarni (Tests) ishga tushirish

```powershell
npm run test -w apps/api
```

*(Barcha 4 ta test suite: AI Provider, Legal Sources, Approval Workflow, Anti-Duplication 100% muvaffaqiyatli o‘tadi)*

### 6. Ilovalarni ishga tushirish

```powershell
# API Backend server (:3000)
npm run dev:api

# Admin Dashboard (:3001)
npm run dev:admin

# Telegram Bot
npm run dev:bot
```

### 7. Docker orqali ishga tushirish (agar Docker o‘rnatilgan bo‘lsa)

```powershell
docker compose up -d
```

---

## 📖 API Hujjatlari (Swagger)

API server ishga tushgach, to‘liq interaktiv Swagger hujjatlari quyidagi manzilda mavjud bo‘ladi:
`http://localhost:3000/api/docs`

## ⚖️ Litsenziya

MIT License. O‘zbekiston Respublikasi qonunchiligi ochiq manbalariga asoslangan.
