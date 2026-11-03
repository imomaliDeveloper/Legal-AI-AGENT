"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAIProvider = createAIProvider;
const shared_1 = require("@legal-aid-ai/shared");
const gemini_provider_1 = require("./gemini.provider");
const claude_provider_1 = require("./claude.provider");
function createAIProvider(config) {
    const fullConfig = {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model ?? (config.provider === 'gemini' ? 'gemini-2.0-flash' : 'claude-3-5-sonnet-20241022'),
        maxTokens: config.maxTokens ?? shared_1.AI_DEFAULTS.MAX_TOKENS,
        temperature: config.temperature ?? shared_1.AI_DEFAULTS.TEMPERATURE,
        timeoutMs: config.timeoutMs ?? shared_1.AI_DEFAULTS.TIMEOUT_MS,
        maxRetries: config.maxRetries ?? shared_1.AI_DEFAULTS.MAX_RETRIES,
    };
    switch (fullConfig.provider) {
        case 'gemini':
            return new gemini_provider_1.GeminiProvider(fullConfig);
        case 'claude':
            return new claude_provider_1.ClaudeProvider(fullConfig);
        default:
            throw new Error(`Noma'lum AI provayder: ${fullConfig.provider}`);
    }
}
//# sourceMappingURL=ai-factory.js.map