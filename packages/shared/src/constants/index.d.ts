export declare const TELEGRAM_RATE_LIMIT = 30;
export declare const DEFAULT_TIMEZONE = "Asia/Tashkent";
export declare const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;
export declare const SUPPORTED_IMAGE_FORMATS: readonly ["image/jpeg", "image/png", "image/webp", "image/gif"];
export declare const DEFAULT_SCHEDULE: {
    readonly news: {
        readonly hour: 8;
        readonly minute: 0;
        readonly label: "Yangiliklar";
    };
    readonly education: {
        readonly hour: 12;
        readonly minute: 0;
        readonly label: "Ta'limiy maqola";
    };
    readonly caseStudy: {
        readonly hour: 16;
        readonly minute: 0;
        readonly label: "Amaliy vaziyat";
    };
    readonly quiz: {
        readonly hour: 19;
        readonly minute: 0;
        readonly label: "Viktorina";
    };
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
};
export declare const AI_DEFAULTS: {
    readonly MAX_TOKENS: 4096;
    readonly TEMPERATURE: 0.7;
    readonly TIMEOUT_MS: 60000;
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY_MS: 1000;
};
export declare const LEGAL_SOURCE_CHECK_INTERVAL_MS: number;
