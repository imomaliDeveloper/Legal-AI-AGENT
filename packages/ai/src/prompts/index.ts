import { ContentType, LegalDomain, DifficultyLevel } from '@legal-aid-ai/shared';

const SYSTEM_PROMPT_BASE = `Sen O'zbekiston huquqi bo'yicha tajribali yurist va kontent yaratuvchisan.

MUHIM QOIDALAR:
1. Faqat o'zbek tilida (lotin alifbosida) yoz.
2. Rasmiy manbalardan foydalangan holda yoz (lex.uz, gov.uz).
3. Qonun maqolalari, bandlar raqamlarini ko'rsat.
4. Tasdiqlanmagan ma'lumotlarni "TASDIQLANMAGAN" deb belgilab qo'y.
5. HECH QACHON huquqiy kontentni o'ylab topma.
6. Sodda va tushunarli tilda yoz.
7. Har bir da'voni qonun manbalari bilan asosla.`;

const DIFFICULTY_INSTRUCTIONS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.BEGINNER]: 'Oddiy fuqarolar uchun sodda tilda yoz. Huquqiy atamalarni tushuntirib ber.',
  [DifficultyLevel.INTERMEDIATE]: 'O\'rta darajadagi o\'quvchilar uchun yoz. Asosiy huquqiy atamalarni ishlatishing mumkin.',
  [DifficultyLevel.ADVANCED]: 'Mutaxassislar uchun chuqur tahlil bilan yoz. Professional huquqiy terminologiyadan foydalanishing mumkin.',
};

const DOMAIN_CONTEXT: Record<LegalDomain, string> = {
  [LegalDomain.CONSTITUTIONAL]: 'O\'zbekiston Respublikasi Konstitutsiyasi va konstitutsiyaviy huquq sohasida',
  [LegalDomain.CIVIL]: 'Fuqarolik kodeksi va fuqarolik huquqi sohasida',
  [LegalDomain.CRIMINAL]: 'Jinoyat kodeksi va jinoyat huquqi sohasida',
  [LegalDomain.ADMINISTRATIVE]: 'Ma\'muriy javobgarlik kodeksi va ma\'muriy huquq sohasida',
  [LegalDomain.LABOR]: 'Mehnat kodeksi va mehnat huquqi sohasida',
  [LegalDomain.FAMILY]: 'Oila kodeksi va oilaviy huquq sohasida',
  [LegalDomain.TAX]: 'Soliq kodeksi va soliq huquqi sohasida',
  [LegalDomain.BUSINESS]: 'Tadbirkorlik va biznes huquqi sohasida',
  [LegalDomain.HUMAN_RIGHTS]: 'Inson huquqlari va erkinliklari sohasida',
};

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT_BASE;
}

export function buildPrompt(options: {
  contentType: ContentType;
  legalDomain: LegalDomain;
  difficultyLevel: DifficultyLevel;
  topic?: string;
  context?: string;
  additionalInstructions?: string;
}): string {
  const { contentType, legalDomain, difficultyLevel, topic, context, additionalInstructions } = options;

  const domainCtx = DOMAIN_CONTEXT[legalDomain];
  const difficultyInstr = DIFFICULTY_INSTRUCTIONS[difficultyLevel];

  const templates: Record<ContentType, string> = {
    [ContentType.NEWS]: buildNewsPrompt(domainCtx, difficultyInstr, topic, context),
    [ContentType.EDUCATIONAL_ARTICLE]: buildEducationalPrompt(domainCtx, difficultyInstr, topic, context),
    [ContentType.CASE_STUDY]: buildCaseStudyPrompt(domainCtx, difficultyInstr, topic, context),
    [ContentType.QUIZ]: buildQuizPrompt(domainCtx, difficultyInstr, topic, context),
    [ContentType.QA_RESPONSE]: buildQAPrompt(domainCtx, difficultyInstr, topic, context),
    [ContentType.INFOGRAPHIC]: buildInfographicPrompt(domainCtx, difficultyInstr, topic, context),
  };

  let prompt = templates[contentType];

  if (additionalInstructions) {
    prompt += `\n\nQo'shimcha ko'rsatmalar: ${additionalInstructions}`;
  }

  return prompt;
}

function buildNewsPrompt(domain: string, difficulty: string, topic?: string, context?: string): string {
  return `${domain} yangilik maqolasi yoz.

${difficulty}

MAVZU: ${topic ?? 'Eng so\'nggi huquqiy o\'zgarishlar'}
${context ? `KONTEKST: ${context}` : ''}

MAQOLA TUZILISHI:
1. SARLAVHA: Qisqa va aniq sarlavha
2. KIRISH: Yangilik mohiyati (1-2 gap)
3. ASOSIY QISM:
   - Nima o'zgardi
   - Qachondan kuchga kiradi
   - Kimga ta'sir qiladi
4. HUQUQIY ASOS: Tegishli qonun moddalari
5. SHARH: Ekspert fikri yoki amaliy ahamiyati
6. MANBA: Rasmiy manbalar havolalari

FORMAT: Telegram post uchun mos, 500-800 so'z.`;
}

function buildEducationalPrompt(domain: string, difficulty: string, topic?: string, context?: string): string {
  return `${domain} ta'limiy maqola yoz.

${difficulty}

MAVZU: ${topic ?? 'Fuqarolarning asosiy huquqlari'}
${context ? `KONTEKST: ${context}` : ''}

MAQOLA TUZILISHI:
1. SARLAVHA: O'quvchini qiziqtiradigan sarlavha
2. KIRISH: Mavzuning ahamiyati va dolzarbligi
3. ASOSIY TUSHUNCHALAR: Muhim huquqiy atamalar izohi
4. BATAFSIL TAHLIL:
   - Qonuniy asoslar
   - Amaliy qo'llanishi
   - Misollar
5. AMALIY MASLAHAT: Fuqaro nima qilishi kerak
6. XULOSA: Asosiy fikrlar qisqacha
7. MANBALAR: Qonun moddalari va rasmiy manbalar

FORMAT: O'quv qo'llanma uslubida, 800-1200 so'z.`;
}

function buildCaseStudyPrompt(domain: string, difficulty: string, topic?: string, context?: string): string {
  return `${domain} amaliy vaziyat (keys-stadi) yoz.

${difficulty}

MAVZU: ${topic ?? 'Huquqiy muammo va yechim'}
${context ? `KONTEKST: ${context}` : ''}

TUZILISH:
1. SARLAVHA: Vaziyatni aks ettiruvchi nom
2. VAZIYAT TAVSIFI: Real hayotga yaqin holat
3. HUQUQIY MUAMMO: Qanday huquqiy savol tug'iladi
4. TAHLIL:
   - Qo'llaniladigan qonun normalari
   - Turli yondashuvlar
   - Sud amaliyotidan misollar
5. YECHIM: Qonuniy yechim va asoslash
6. SABOQ: O'quvchi nimani o'rganishi kerak
7. MANBALAR: Tegishli qonun moddalari

FORMAT: Interaktiv uslubda, 600-1000 so'z.`;
}

function buildQuizPrompt(domain: string, difficulty: string, topic?: string, context?: string): string {
  return `${domain} huquqiy viktorina savollari yarat.

${difficulty}

MAVZU: ${topic ?? 'Umumiy huquqiy bilimlar'}
${context ? `KONTEKST: ${context}` : ''}

5 ta savol yarat. Har bir savol uchun:

FORMAT (JSON):
{
  "questions": [
    {
      "question": "Savol matni",
      "options": ["A varianti", "B varianti", "C varianti", "D varianti"],
      "correctAnswer": 0,
      "explanation": "Nima uchun bu javob to'g'ri - qonun manbasini ko'rsat",
      "legalReference": "Tegishli qonun moddasi"
    }
  ]
}

MUHIM:
- Har bir savolda 4 ta variant bo'lsin
- To'g'ri javob indeksi 0 dan boshlanadi
- Tushuntirish qonun manbasiga asoslangan bo'lsin
- Noto'g'ri variantlar ham mantiqiy ko'rinsin`;
}

function buildQAPrompt(domain: string, difficulty: string, topic?: string, context?: string): string {
  return `${domain} fuqaro savoliga javob yoz.

${difficulty}

SAVOL: ${topic ?? 'Huquqiy savol'}
${context ? `QO'SHIMCHA KONTEKST: ${context}` : ''}

JAVOB TUZILISHI:
1. QISQA JAVOB: 1-2 gapda asosiy javob
2. BATAFSIL TUSHUNTIRISH:
   - Qonuniy asoslar
   - Amaliy qadamlar
   - Muhim mudatlar (agar mavjud bo'lsa)
3. KERAKLI HUJJATLAR: Qanday hujjatlar kerak (agar tegishli bo'lsa)
4. QAERGA MUROJAAT QILISH: Tegishli davlat organlari
5. OGOHLANTIRISH: Mumkin bo'lgan xavflar yoki cheklovlar
6. MANBALAR: Qonun moddalari

FORMAT: Sodda va tushunarli, 300-600 so'z.
MUHIM: Agar savol murakkab bo'lsa, professional yuristga murojaat qilishni maslahat ber.`;
}

function buildInfographicPrompt(domain: string, difficulty: string, topic?: string, context?: string): string {
  return `${domain} infografika uchun kontent yarat.

${difficulty}

MAVZU: ${topic ?? 'Huquqiy jarayon bosqichlari'}
${context ? `KONTEKST: ${context}` : ''}

FORMAT (JSON):
{
  "title": "Infografika sarlavhasi",
  "subtitle": "Qisqa tushuntirish",
  "sections": [
    {
      "heading": "Bo'lim nomi",
      "icon": "emoji",
      "points": ["Nuqta 1", "Nuqta 2"]
    }
  ],
  "footer": "Qo'shimcha ma'lumot yoki manba",
  "legalReferences": ["Qonun moddasi"]
}

MUHIM:
- Qisqa va ixcham matn
- Har bir bo'limda 2-4 nuqta
- Vizual tushunish uchun emoji ishlatish`;
}

export function buildDocumentAnalysisPrompt(documentText: string, question?: string): string {
  return `Quyidagi huquqiy hujjatni tahlil qil:

---
${documentText}
---

${question ? `SAVOL: ${question}` : 'Hujjatning asosiy mazmunini tahlil qil.'}

TAHLIL TUZILISHI:
1. HUJJAT TURI: Qanday turdagi hujjat
2. ASOSIY MAZMUN: Nimaga oid
3. MUHIM MODDALAR: Eng muhim bandlar
4. AMALIY AHAMIYATI: Fuqarolar uchun nimani anglatadi
5. E'TIBOR BERISH KERAK: Muhim muddatlar, shartlar, cheklovlar
6. XULOSA: Qisqacha umumiy baho

MUHIM: Hujjat matnidan tashqari hech narsa qo'shma. Agar biror narsa noaniq bo'lsa, "ANIQLASHTIRISH TALAB ETILADI" deb belgilab qo'y.`;
}
