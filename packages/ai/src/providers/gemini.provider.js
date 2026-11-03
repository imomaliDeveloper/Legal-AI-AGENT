"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const shared_1 = require("@legal-aid-ai/shared");
class GeminiProvider {
    constructor(config) {
        this.lastRequestTime = 0;
        this.minRequestIntervalMs = 100;
        this.config = config;
        const genAI = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        this.model = genAI.getGenerativeModel({
            model: config.model,
            generationConfig: {
                maxOutputTokens: config.maxTokens,
                temperature: config.temperature,
            },
        });
    }
    async rateLimit() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.minRequestIntervalMs) {
            await (0, shared_1.sleep)(this.minRequestIntervalMs - elapsed);
        }
        this.lastRequestTime = Date.now();
    }
    async generateText(prompt, systemPrompt) {
        await this.rateLimit();
        const startTime = Date.now();
        const result = await (0, shared_1.retry)(async () => {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout')), this.config.timeoutMs));
            const parts = [];
            if (systemPrompt) {
                parts.push(systemPrompt + '\n\n');
            }
            parts.push(prompt);
            const generatePromise = this.model.generateContent(parts.join(''));
            return Promise.race([generatePromise, timeoutPromise]);
        }, {
            maxRetries: this.config.maxRetries,
            delayMs: 1000,
            onRetry: (error, attempt) => {
                console.warn(`Gemini retry ${attempt}/${this.config.maxRetries}: ${error.message}`);
            },
        });
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
    async generateStructured(prompt, schema, systemPrompt) {
        const structuredPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON that matches the required schema. No extra text.`;
        const result = await this.generateText(structuredPrompt, systemPrompt);
        let jsonStr = result.content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        const parsed = JSON.parse(jsonStr);
        const validated = schema.parse(parsed);
        validated._meta = result;
        return validated;
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=gemini.provider.js.map