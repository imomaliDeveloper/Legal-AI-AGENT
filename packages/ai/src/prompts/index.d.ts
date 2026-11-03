import { ContentType, LegalDomain, DifficultyLevel } from '@legal-aid-ai/shared';
export declare function getSystemPrompt(): string;
export declare function buildPrompt(options: {
    contentType: ContentType;
    legalDomain: LegalDomain;
    difficultyLevel: DifficultyLevel;
    topic?: string;
    context?: string;
    additionalInstructions?: string;
}): string;
export declare function buildDocumentAnalysisPrompt(documentText: string, question?: string): string;
