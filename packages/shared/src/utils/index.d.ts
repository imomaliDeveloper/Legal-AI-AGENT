export declare function formatUzbekDate(date: Date): string;
export declare function sanitizeHtml(html: string): string;
export declare function truncateText(text: string, maxLength: number, suffix?: string): string;
export declare function generateSlug(text: string): string;
export declare function sleep(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (error: Error, attempt: number) => void;
}): Promise<T>;
