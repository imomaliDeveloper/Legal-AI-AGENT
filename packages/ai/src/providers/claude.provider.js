"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = void 0;
const sdk_1 = require("@anthropic-ai/sdk");
const shared_1 = require("@legal-aid-ai/shared");
class ClaudeProvider {
    constructor(config) {
        this.lastRequestTime = 0;
        this.minRequestIntervalMs = 200;
        this.config = config;
        this.client = new sdk_1.default({ apiKey: config.apiKey });
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
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Claude API timeout')), this.config.timeoutMs));
            const generatePromise = this.client.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                system: systemPrompt ?? undefined,
                messages: [{ role: 'user', content: prompt }],
            });
            return Promise.race([generatePromise, timeoutPromise]);
        }, {
            maxRetries: this.config.maxRetries,
            delayMs: 1000,
            onRetry: (error, attempt) => {
                console.warn(`Claude retry ${attempt}/${this.config.maxRetries}: ${error.message}`);
            },
        });
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
    async generateStructured(prompt, schema, systemPrompt) {
        const structuredPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON that matches the required schema. No extra text, no markdown code blocks.`;
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
exports.ClaudeProvider = ClaudeProvider;
//# sourceMappingURL=claude.provider.js.map