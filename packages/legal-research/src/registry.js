"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceRegistry = void 0;
const DEFAULT_SOURCES = [
    {
        id: 'lex-uz',
        name: 'Lex.uz',
        baseUrl: 'https://lex.uz',
        type: 'official',
        isActive: true,
        priority: 1,
    },
    {
        id: 'gov-uz',
        name: 'Gov.uz',
        baseUrl: 'https://gov.uz',
        type: 'official',
        isActive: true,
        priority: 2,
    },
    {
        id: 'norma-uz',
        name: 'Norma.uz',
        baseUrl: 'https://norma.uz',
        type: 'news',
        isActive: true,
        priority: 3,
    },
];
class SourceRegistry {
    constructor() {
        this.sources = new Map();
        for (const source of DEFAULT_SOURCES) {
            this.sources.set(source.id, source);
        }
    }
    addSource(source) {
        this.sources.set(source.id, source);
    }
    removeSource(id) {
        this.sources.delete(id);
    }
    getSource(id) {
        return this.sources.get(id);
    }
    getSources(type) {
        const all = Array.from(this.sources.values())
            .filter((s) => s.isActive)
            .sort((a, b) => a.priority - b.priority);
        if (type) {
            return all.filter((s) => s.type === type);
        }
        return all;
    }
    getPrimarySource() {
        const sources = this.getSources();
        if (sources.length === 0) {
            throw new Error('Hech qanday faol manba topilmadi');
        }
        return sources[0];
    }
    updateLastChecked(id) {
        const source = this.sources.get(id);
        if (source) {
            source.lastChecked = new Date();
        }
    }
}
exports.SourceRegistry = SourceRegistry;
//# sourceMappingURL=registry.js.map