import { createAIProvider, GeminiProvider, ClaudeProvider } from '@legal-aid-ai/ai';

describe('AI Provider Abstraction', () => {
  it('should instantiate Gemini provider with gemini config', () => {
    const provider = createAIProvider({
      provider: 'gemini',
      apiKey: 'test-gemini-key',
      model: 'gemini-1.5-pro',
      maxTokens: 4096,
      temperature: 0.7,
      timeoutMs: 30000,
      maxRetries: 3,
    });

    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it('should instantiate Claude provider with claude config', () => {
    const provider = createAIProvider({
      provider: 'claude',
      apiKey: 'test-claude-key',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      timeoutMs: 30000,
      maxRetries: 3,
    });

    expect(provider).toBeInstanceOf(ClaudeProvider);
  });

  it('should throw error when unknown provider is requested', () => {
    expect(() => {
      createAIProvider({
        provider: 'unknown-llm' as any,
        apiKey: 'key',
        model: 'model',
        maxTokens: 1000,
        temperature: 0.5,
        timeoutMs: 10000,
        maxRetries: 1,
      });
    }).toThrow("Noma'lum AI provayder");
  });
});
