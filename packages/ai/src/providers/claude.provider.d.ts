import { z } from 'zod';
import type { AIProvider, AIProviderConfig, AIGenerationResult } from './ai-provider.interface';
export declare class ClaudeProvider implements AIProvider {
    private readonly client;
    private readonly config;
    private lastRequestTime;
    private readonly minRequestIntervalMs;
    constructor(config: AIProviderConfig);
    private rateLimit;
    generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult>;
    generateStructured<T>(prompt: string, schema: z.ZodSchema<T>, systemPrompt?: string): Promise<T & {
        _meta: AIGenerationResult;
    }>;
}
