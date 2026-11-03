import { z } from 'zod';
import {
  ContentType,
  ContentStatus,
  LegalDomain,
  DifficultyLevel,
  ApprovalAction,
  AIProvider,
} from '../types';

// --- CreatePostDto ---
export const CreatePostDtoSchema = z.object({
  title: z.string().min(1, 'Sarlavha majburiy').max(500),
  content: z.string().min(1, 'Kontent majburiy'),
  summary: z.string().max(1000).optional(),
  contentType: z.nativeEnum(ContentType),
  legalDomain: z.nativeEnum(LegalDomain),
  difficultyLevel: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.BEGINNER),
  legalReferences: z.array(z.string()).default([]),
  sourceUrls: z.array(z.string().url('Noto\'g\'ri URL format')).default([]),
  scheduledAt: z.string().datetime().optional(),
});

export type CreatePostDto = z.infer<typeof CreatePostDtoSchema>;

// --- UpdatePostDto ---
export const UpdatePostDtoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().max(1000).optional(),
  contentType: z.nativeEnum(ContentType).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  legalDomain: z.nativeEnum(LegalDomain).optional(),
  difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
  legalReferences: z.array(z.string()).optional(),
  sourceUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type UpdatePostDto = z.infer<typeof UpdatePostDtoSchema>;

// --- ApproveContentDto ---
export const ApproveContentDtoSchema = z.object({
  action: z.nativeEnum(ApprovalAction),
  comment: z.string().max(2000).optional(),
  editedContent: z.string().optional(),
});

export type ApproveContentDto = z.infer<typeof ApproveContentDtoSchema>;

// --- CreateQuizDto ---
export const CreateQuizDtoSchema = z.object({
  postId: z.string().cuid().optional(),
  question: z.string().min(1, 'Savol majburiy'),
  options: z
    .array(z.string().min(1))
    .min(2, 'Kamida 2 ta variant bo\'lishi kerak')
    .max(6, 'Ko\'pi bilan 6 ta variant'),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().min(1, 'Tushuntirish majburiy'),
  difficultyLevel: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.BEGINNER),
  legalDomain: z.nativeEnum(LegalDomain),
});

export type CreateQuizDto = z.infer<typeof CreateQuizDtoSchema>;

// --- SubscriberQuestionDto ---
export const SubscriberQuestionDtoSchema = z.object({
  telegramId: z.string().min(1),
  question: z.string().min(1, 'Savol majburiy').max(2000),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type SubscriberQuestionDto = z.infer<typeof SubscriberQuestionDtoSchema>;

// --- AIGenerationRequestDto ---
export const AIGenerationRequestDtoSchema = z.object({
  contentType: z.nativeEnum(ContentType),
  legalDomain: z.nativeEnum(LegalDomain),
  difficultyLevel: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.BEGINNER),
  provider: z.nativeEnum(AIProvider).default(AIProvider.GEMINI),
  topic: z.string().min(1, 'Mavzu majburiy').optional(),
  context: z.string().optional(),
  additionalInstructions: z.string().optional(),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type AIGenerationRequestDto = z.infer<typeof AIGenerationRequestDtoSchema>;

// --- SchedulePublicationDto ---
export const SchedulePublicationDtoSchema = z.object({
  postId: z.string().cuid(),
  scheduledAt: z.string().datetime('Noto\'g\'ri sana formati'),
  channelId: z.string().optional(),
  notifySubscribers: z.boolean().default(true),
});

export type SchedulePublicationDto = z.infer<typeof SchedulePublicationDtoSchema>;
