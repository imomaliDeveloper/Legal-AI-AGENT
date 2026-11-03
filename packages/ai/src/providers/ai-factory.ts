import { AI_DEFAULTS } from '@legal-aid-ai/shared';
import type { AIProvider, AIProviderConfig } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { ClaudeProvider } from './claude.provider';

export function createAIProvider(config: Partial<AIProviderConfig> & { provider: 'gemini' | 'claude'; apiKey: string }): AIProvider {
  const fullConfig: AIProviderConfig = {
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model ?? (config.provider === 'gemini' ? 'gemini-2.0-flash' : 'claude-3-5-sonnet-20241022'),
    maxTokens: config.maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
    temperature: config.temperature ?? AI_DEFAULTS.TEMPERATURE,
    timeoutMs: config.timeoutMs ?? AI_DEFAULTS.TIMEOUT_MS,
    maxRetries: config.maxRetries ?? AI_DEFAULTS.MAX_RETRIES,
  };

  switch (fullConfig.provider) {
    case 'gemini':
      return new GeminiProvider(fullConfig);
    case 'claude':
      return new ClaudeProvider(fullConfig);
    default:
      throw new Error(`Noma'lum AI provayder: ${fullConfig.provider}`);
  }
}
