import { z } from 'zod';
import { ContentType, ContentStatus, LegalDomain, DifficultyLevel, ApprovalAction, AIProvider } from '../types';
export declare const CreatePostDtoSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    contentType: z.ZodNativeEnum<typeof ContentType>;
    legalDomain: z.ZodNativeEnum<typeof LegalDomain>;
    difficultyLevel: z.ZodDefault<z.ZodNativeEnum<typeof DifficultyLevel>>;
    legalReferences: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    sourceUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    summary?: string;
    content?: string;
    title?: string;
    legalDomain?: LegalDomain;
    legalReferences?: string[];
    contentType?: ContentType;
    difficultyLevel?: DifficultyLevel;
    sourceUrls?: string[];
    scheduledAt?: string;
}, {
    summary?: string;
    content?: string;
    title?: string;
    legalDomain?: LegalDomain;
    legalReferences?: string[];
    contentType?: ContentType;
    difficultyLevel?: DifficultyLevel;
    sourceUrls?: string[];
    scheduledAt?: string;
}>;
export type CreatePostDto = z.infer<typeof CreatePostDtoSchema>;
export declare const UpdatePostDtoSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    contentType: z.ZodOptional<z.ZodNativeEnum<typeof ContentType>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ContentStatus>>;
    legalDomain: z.ZodOptional<z.ZodNativeEnum<typeof LegalDomain>>;
    difficultyLevel: z.ZodOptional<z.ZodNativeEnum<typeof DifficultyLevel>>;
    legalReferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sourceUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    summary?: string;
    content?: string;
    title?: string;
    status?: ContentStatus;
    legalDomain?: LegalDomain;
    legalReferences?: string[];
    contentType?: ContentType;
    difficultyLevel?: DifficultyLevel;
    sourceUrls?: string[];
    scheduledAt?: string;
}, {
    summary?: string;
    content?: string;
    title?: string;
    status?: ContentStatus;
    legalDomain?: LegalDomain;
    legalReferences?: string[];
    contentType?: ContentType;
    difficultyLevel?: DifficultyLevel;
    sourceUrls?: string[];
    scheduledAt?: string;
}>;
export type UpdatePostDto = z.infer<typeof UpdatePostDtoSchema>;
export declare const ApproveContentDtoSchema: z.ZodObject<{
    action: z.ZodNativeEnum<typeof ApprovalAction>;
    comment: z.ZodOptional<z.ZodString>;
    editedContent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    editedContent?: string;
    action?: ApprovalAction;
    comment?: string;
}, {
    editedContent?: string;
    action?: ApprovalAction;
    comment?: string;
}>;
export type ApproveContentDto = z.infer<typeof ApproveContentDtoSchema>;
export declare const CreateQuizDtoSchema: z.ZodObject<{
    postId: z.ZodOptional<z.ZodString>;
    question: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
    correctAnswer: z.ZodNumber;
    explanation: z.ZodString;
    difficultyLevel: z.ZodDefault<z.ZodNativeEnum<typeof DifficultyLevel>>;
    legalDomain: z.ZodNativeEnum<typeof LegalDomain>;
}, "strip", z.ZodTypeAny, {
    legalDomain?: LegalDomain;
    postId?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    question?: string;
    difficultyLevel?: DifficultyLevel;
}, {
    legalDomain?: LegalDomain;
    postId?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    question?: string;
    difficultyLevel?: DifficultyLevel;
}>;
export type CreateQuizDto = z.infer<typeof CreateQuizDtoSchema>;
export declare const SubscriberQuestionDtoSchema: z.ZodObject<{
    telegramId: z.ZodString;
    question: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username?: string;
    telegramId?: string;
    question?: string;
    firstName?: string;
    lastName?: string;
}, {
    username?: string;
    telegramId?: string;
    question?: string;
    firstName?: string;
    lastName?: string;
}>;
export type SubscriberQuestionDto = z.infer<typeof SubscriberQuestionDtoSchema>;
export declare const AIGenerationRequestDtoSchema: z.ZodObject<{
    contentType: z.ZodNativeEnum<typeof ContentType>;
    legalDomain: z.ZodNativeEnum<typeof LegalDomain>;
    difficultyLevel: z.ZodDefault<z.ZodNativeEnum<typeof DifficultyLevel>>;
    provider: z.ZodDefault<z.ZodNativeEnum<typeof AIProvider>>;
    topic: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodString>;
    additionalInstructions: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    temperature: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    legalDomain?: LegalDomain;
    provider?: AIProvider;
    contentType?: ContentType;
    difficultyLevel?: DifficultyLevel;
    topic?: string;
    context?: string;
    additionalInstructions?: string;
    maxTokens?: number;
    temperature?: number;
}, {
    legalDomain?: LegalDomain;
    provider?: AIProvider;
    contentType?: ContentType;
    difficultyLevel?: DifficultyLevel;
    topic?: string;
    context?: string;
    additionalInstructions?: string;
    maxTokens?: number;
    temperature?: number;
}>;
export type AIGenerationRequestDto = z.infer<typeof AIGenerationRequestDtoSchema>;
export declare const SchedulePublicationDtoSchema: z.ZodObject<{
    postId: z.ZodString;
    scheduledAt: z.ZodString;
    channelId: z.ZodOptional<z.ZodString>;
    notifySubscribers: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    postId?: string;
    channelId?: string;
    scheduledAt?: string;
    notifySubscribers?: boolean;
}, {
    postId?: string;
    channelId?: string;
    scheduledAt?: string;
    notifySubscribers?: boolean;
}>;
export type SchedulePublicationDto = z.infer<typeof SchedulePublicationDtoSchema>;
