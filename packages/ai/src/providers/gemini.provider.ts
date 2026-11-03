import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import { retry, sleep } from '@legal-aid-ai/shared';
import type { AIProvider, AIProviderConfig, AIGenerationResult } from './ai-provider.interface';

export class GeminiProvider implements AIProvider {
  private readonly model: GenerativeModel;
  private readonly config: AIProviderConfig;
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs = 100;

  constructor(config: AIProviderConfig) {
    this.config = config;
    const genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
      },
    });
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await sleep(this.minRequestIntervalMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    await this.rateLimit();

    const startTime = Date.now();

    const result = await retry(
      async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), this.config.timeoutMs),
        );

        const parts: string[] = [];
        if (systemPrompt) {
          parts.push(systemPrompt + '\n\n');
        }
        parts.push(prompt);

        const generatePromise = this.model.generateContent(parts.join(''));

        return Promise.race([generatePromise, timeoutPromise]);
      },
      {
        maxRetries: this.config.maxRetries,
        delayMs: 1000,
        onRetry: (error, attempt) => {
          console.warn(`Gemini retry ${attempt}/${this.config.maxRetries}: ${error.message}`);
        },
      },
    );

    const response = result.response;
    const text = response.text();
    const usageMetadata = response.usageMetadata;

    return {
      content: text,
      model: this.config.model,
      provider: 'gemini',
      tokensUsed: usageMetadata?.totalTokenCount ?? 0,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        promptTokens: usageMetadata?.promptTokenCount,
        completionTokens: usageMetadata?.candidatesTokenCount,
      },
    };
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemPrompt?: string,
  ): Promise<T & { _meta: AIGenerationResult }> {
    const structuredPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON that matches the required schema. No extra text.`;

    const result = await this.generateText(structuredPrompt, systemPrompt);

    // Extract JSON from the response
    let jsonStr = result.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    const validated = schema.parse(parsed) as T & { _meta: AIGenerationResult };
    validated._meta = result;

    return validated;
  }
}
