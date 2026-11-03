import { z } from 'zod';

export interface AIProviderConfig {
  provider: 'gemini' | 'claude';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  maxRetries: number;
}

export interface AIGenerationResult {
  content: string;
  model: string;
  provider: string;
  tokensUsed: number;
  processingTimeMs: number;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult>;
  generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemPrompt?: string,
  ): Promise<T & { _meta: AIGenerationResult }>;
}
