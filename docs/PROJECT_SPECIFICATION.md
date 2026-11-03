# Legal Aid AI — Project Specification

## 1. Project Overview

**Legal Aid AI** is an AI-powered legal media platform designed to automate content creation and publishing for the Uzbek legal education Telegram channel **[@Huquq_study](https://t.me/Huquq_study)**. The platform discovers legal news, researches legislation, generates educational content, and publishes it to Telegram — all in a semi-autonomous workflow with human approval gates.

The system operates in **Uzbek (Latin script)** and targets the legal landscape of the **Republic of Uzbekistan**, sourcing legislation primarily from [lex.uz](https://lex.uz/) — the official national legislation database.

---

## 2. Core Objectives

| # | Objective | Description |
|---|-----------|-------------|
| 1 | **Discover Legal News** | Automatically monitor and discover new laws, amendments, decrees, and legal developments from lex.uz and other Uzbek legal sources |
| 2 | **Research Documents** | Deep-research discovered legal documents, extracting key provisions, implications, and relevant context |
| 3 | **Generate Articles** | Produce educational articles in Uzbek Latin script explaining legal developments in accessible language |
| 4 | **Create Case Studies** | Generate practical case studies illustrating real-world application of laws and regulations |
| 5 | **Generate Quizzes** | Create interactive legal quizzes for subscriber engagement and knowledge testing |
| 6 | **Create Infographics** | Generate visual infographic descriptions and media content for Telegram posts |
| 7 | **Answer Subscriber Questions** | Process and respond to subscriber-submitted legal questions with AI-researched answers |
| 8 | **Admin Approval Workflow** | Route all generated content through an admin approval pipeline before publishing |
| 9 | **Publish to Telegram** | Automatically publish approved content to @Huquq_study with proper formatting and scheduling |
| 10 | **Analytics & Reporting** | Track content performance, subscriber engagement, and system health metrics |

---

## 3. Technology Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **NestJS** (v10+) | Backend framework — modular, scalable, TypeScript-first |
| **PostgreSQL** (v15+) | Primary relational database |
| **Prisma** (v5+) | Type-safe ORM and database toolkit |
| **Redis** (v7+) | Caching, session store, and message broker |
| **BullMQ** | Distributed job queue for background processing |
| **Telegraf** | Telegram Bot API framework for Node.js |
| **Zod** | Runtime schema validation and type inference |
| **Passport + JWT** | Authentication and authorization |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Next.js** (v14+) | Admin dashboard — React-based SSR framework |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible component library |

### AI & Research

| Technology | Purpose |
|-----------|---------|
| **Google Gemini API** | Primary AI provider for content generation |
| **Anthropic Claude API** | Alternative AI provider (configurable) |
| **Cheerio / Playwright** | Web scraping for legal document research |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Docker + Docker Compose** | Containerized development and deployment |
| **pnpm** | Fast, efficient monorepo package manager |
| **Turborepo** | Monorepo build orchestration |
| **Winston** | Structured logging |

---

## 4. Operating Mode: Semi-Autonomous

The platform operates in a **semi-autonomous** mode, meaning:

1. **Automated Discovery**: The system autonomously discovers new legal developments on a configurable schedule.
2. **Automated Research**: Discovered items are automatically researched and enriched with context.
3. **Automated Generation**: Content (articles, quizzes, case studies) is generated without human intervention.
4. **Human Approval Gate**: All generated content is routed to admin(s) for review and approval via Telegram and/or admin dashboard.
5. **Automated Publishing**: Approved content is automatically formatted and published to Telegram on schedule.

```
[Auto] Discover → [Auto] Research → [Auto] Generate → [Human] Approve → [Auto] Publish
```

This ensures content quality and legal accuracy while minimizing manual effort.

---

## 5. Target Audience & Locale

| Parameter | Value |
|-----------|-------|
| **Target Country** | Republic of Uzbekistan (O'zbekiston Respublikasi) |
| **Primary Language** | Uzbek — Latin script (O'zbek tili, lotin yozuvi) |
| **Timezone** | Asia/Tashkent (UTC+5) |
| **Target Audience** | Uzbek citizens, law students, legal professionals, business owners |
| **Distribution Channel** | Telegram channel @Huquq_study |

### Language Guidelines

- All user-facing content **MUST** be in Uzbek Latin script
- System logs, code comments, and developer documentation are in English
- AI prompts include explicit language instructions for Uzbek output
- Content uses formal but accessible Uzbek legal language

---

## 6. Primary Legal Source

### lex.uz — National Legislation Database

| Parameter | Value |
|-----------|-------|
| **URL** | [https://lex.uz/](https://lex.uz/) |
| **Operator** | National Database of Legislation of the Republic of Uzbekistan |
| **Content** | Laws, Presidential Decrees, Cabinet of Ministers Decisions, Regulations |
| **Languages** | Uzbek, Russian |
| **Access** | Public, free access |

The system will:
- Monitor lex.uz for newly published legal documents
- Scrape and parse document content for research
- Extract metadata (document number, date, category, status)
- Link back to original source in all published content
- Respect rate limits and robots.txt directives

---

## 7. Content Types

### 7.1 Legal News Articles (Yangiliklar)

Educational articles explaining new laws and amendments in accessible language. Each article includes:
- Title and summary
- Key provisions breakdown
- Practical implications
- Link to original legal text on lex.uz
- Relevant hashtags

### 7.2 Case Studies (Amaliy holatlar)

Practical scenarios illustrating how laws apply in real-world situations:
- Scenario description
- Applicable legal framework
- Analysis and resolution
- Key takeaways

### 7.3 Quizzes (Testlar)

Interactive multiple-choice quizzes for subscriber engagement:
- Question with 3-4 answer options
- Correct answer with legal explanation
- Reference to relevant legislation

### 7.4 Infographics (Infografikalar)

Visual content descriptions for Telegram posts:
- Structured data for visual representation
- Key statistics and facts
- Comparison charts and timelines

### 7.5 Q&A Responses (Savollar va javoblar)

Responses to subscriber-submitted legal questions:
- Acknowledgment of the question
- Researched answer with legal references
- Disclaimer about professional legal advice

---

## 8. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| **Availability** | 99.5% uptime |
| **Response Time** | Admin API < 500ms p95 |
| **Content Generation** | < 60s per article |
| **Concurrent Users** | 50+ admin dashboard users |
| **Telegram Publishing** | Respect Telegram rate limits (30 msg/sec) |
| **Data Retention** | All content and audit logs retained for 2 years |
| **Security** | RBAC, JWT auth, audit logging, encrypted secrets |
| **Scalability** | Horizontal scaling via containerization |

---

## 9. Legal & Compliance

- All published content includes a disclaimer that it is for educational purposes only
- Content links back to original legislation on lex.uz
- No personal legal advice is provided
- Subscriber data is handled in accordance with Uzbekistan's data protection regulations
- The platform does not store or process sensitive personal legal cases

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| **Content Output** | 5-10 posts/day to @Huquq_study |
| **Approval Rate** | > 80% of generated content approved without major edits |
| **Subscriber Growth** | Measurable increase in channel subscribers |
| **Engagement** | > 5% engagement rate on quiz posts |
| **System Reliability** | < 1% content generation failure rate |
| **Admin Time** | < 30 min/day for content review and approval |
