import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { retry, sleep } from '@legal-aid-ai/shared';
import type { AIProvider, AIProviderConfig, AIGenerationResult } from './ai-provider.interface';

export class ClaudeProvider implements AIProvider {
  private readonly client: Anthropic;
  private readonly config: AIProviderConfig;
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs = 200;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.apiKey });
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
          setTimeout(() => reject(new Error('Claude API timeout')), this.config.timeoutMs),
        );

        const generatePromise = this.client.messages.create({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: systemPrompt ?? undefined,
          messages: [{ role: 'user', content: prompt }],
        });

        return Promise.race([generatePromise, timeoutPromise]);
      },
      {
        maxRetries: this.config.maxRetries,
        delayMs: 1000,
        onRetry: (error, attempt) => {
          console.warn(`Claude retry ${attempt}/${this.config.maxRetries}: ${error.message}`);
        },
      },
    );

    const textBlock = result.content.find((block) => block.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      content: text,
      model: this.config.model,
      provider: 'claude',
      tokensUsed: (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0),
      processingTimeMs: Date.now() - startTime,
      metadata: {
        inputTokens: result.usage?.input_tokens,
        outputTokens: result.usage?.output_tokens,
        stopReason: result.stop_reason,
      },
    };
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemPrompt?: string,
  ): Promise<T & { _meta: AIGenerationResult }> {
    const structuredPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON that matches the required schema. No extra text, no markdown code blocks.`;

    const result = await this.generateText(structuredPrompt, systemPrompt);

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
