import type { AIProvider, AIProviderConfig } from './ai-provider.interface';
export declare function createAIProvider(config: Partial<AIProviderConfig> & {
    provider: 'gemini' | 'claude';
    apiKey: string;
}): AIProvider;
