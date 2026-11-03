"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulePublicationDtoSchema = exports.AIGenerationRequestDtoSchema = exports.SubscriberQuestionDtoSchema = exports.CreateQuizDtoSchema = exports.ApproveContentDtoSchema = exports.UpdatePostDtoSchema = exports.CreatePostDtoSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.CreatePostDtoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Sarlavha majburiy').max(500),
    content: zod_1.z.string().min(1, 'Kontent majburiy'),
    summary: zod_1.z.string().max(1000).optional(),
    contentType: zod_1.z.nativeEnum(types_1.ContentType),
    legalDomain: zod_1.z.nativeEnum(types_1.LegalDomain),
    difficultyLevel: zod_1.z.nativeEnum(types_1.DifficultyLevel).default(types_1.DifficultyLevel.BEGINNER),
    legalReferences: zod_1.z.array(zod_1.z.string()).default([]),
    sourceUrls: zod_1.z.array(zod_1.z.string().url('Noto\'g\'ri URL format')).default([]),
    scheduledAt: zod_1.z.string().datetime().optional(),
});
exports.UpdatePostDtoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500).optional(),
    content: zod_1.z.string().min(1).optional(),
    summary: zod_1.z.string().max(1000).optional(),
    contentType: zod_1.z.nativeEnum(types_1.ContentType).optional(),
    status: zod_1.z.nativeEnum(types_1.ContentStatus).optional(),
    legalDomain: zod_1.z.nativeEnum(types_1.LegalDomain).optional(),
    difficultyLevel: zod_1.z.nativeEnum(types_1.DifficultyLevel).optional(),
    legalReferences: zod_1.z.array(zod_1.z.string()).optional(),
    sourceUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    scheduledAt: zod_1.z.string().datetime().optional(),
});
exports.ApproveContentDtoSchema = zod_1.z.object({
    action: zod_1.z.nativeEnum(types_1.ApprovalAction),
    comment: zod_1.z.string().max(2000).optional(),
    editedContent: zod_1.z.string().optional(),
});
exports.CreateQuizDtoSchema = zod_1.z.object({
    postId: zod_1.z.string().cuid().optional(),
    question: zod_1.z.string().min(1, 'Savol majburiy'),
    options: zod_1.z
        .array(zod_1.z.string().min(1))
        .min(2, 'Kamida 2 ta variant bo\'lishi kerak')
        .max(6, 'Ko\'pi bilan 6 ta variant'),
    correctAnswer: zod_1.z.number().int().min(0),
    explanation: zod_1.z.string().min(1, 'Tushuntirish majburiy'),
    difficultyLevel: zod_1.z.nativeEnum(types_1.DifficultyLevel).default(types_1.DifficultyLevel.BEGINNER),
    legalDomain: zod_1.z.nativeEnum(types_1.LegalDomain),
});
exports.SubscriberQuestionDtoSchema = zod_1.z.object({
    telegramId: zod_1.z.string().min(1),
    question: zod_1.z.string().min(1, 'Savol majburiy').max(2000),
    username: zod_1.z.string().optional(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
});
exports.AIGenerationRequestDtoSchema = zod_1.z.object({
    contentType: zod_1.z.nativeEnum(types_1.ContentType),
    legalDomain: zod_1.z.nativeEnum(types_1.LegalDomain),
    difficultyLevel: zod_1.z.nativeEnum(types_1.DifficultyLevel).default(types_1.DifficultyLevel.BEGINNER),
    provider: zod_1.z.nativeEnum(types_1.AIProvider).default(types_1.AIProvider.GEMINI),
    topic: zod_1.z.string().min(1, 'Mavzu majburiy').optional(),
    context: zod_1.z.string().optional(),
    additionalInstructions: zod_1.z.string().optional(),
    maxTokens: zod_1.z.number().int().positive().default(4096),
    temperature: zod_1.z.number().min(0).max(2).default(0.7),
});
exports.SchedulePublicationDtoSchema = zod_1.z.object({
    postId: zod_1.z.string().cuid(),
    scheduledAt: zod_1.z.string().datetime('Noto\'g\'ri sana formati'),
    channelId: zod_1.z.string().optional(),
    notifySubscribers: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=index.js.map