export interface LegalSource {
    id: string;
    name: string;
    baseUrl: string;
    type: 'official' | 'news' | 'academic';
    isActive: boolean;
    lastChecked?: Date;
    priority: number;
}
export declare class SourceRegistry {
    private sources;
    constructor();
    addSource(source: LegalSource): void;
    removeSource(id: string): void;
    getSource(id: string): LegalSource | undefined;
    getSources(type?: string): LegalSource[];
    getPrimarySource(): LegalSource;
    updateLastChecked(id: string): void;
}
