export interface LegalSource {
  id: string;
  name: string;
  baseUrl: string;
  type: 'official' | 'news' | 'academic';
  isActive: boolean;
  lastChecked?: Date;
  priority: number;
}

const DEFAULT_SOURCES: LegalSource[] = [
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

export class SourceRegistry {
  private sources: Map<string, LegalSource> = new Map();

  constructor() {
    for (const source of DEFAULT_SOURCES) {
      this.sources.set(source.id, source);
    }
  }

  addSource(source: LegalSource): void {
    this.sources.set(source.id, source);
  }

  removeSource(id: string): void {
    this.sources.delete(id);
  }

  getSource(id: string): LegalSource | undefined {
    return this.sources.get(id);
  }

  getSources(type?: string): LegalSource[] {
    const all = Array.from(this.sources.values())
      .filter((s) => s.isActive)
      .sort((a, b) => a.priority - b.priority);

    if (type) {
      return all.filter((s) => s.type === type);
    }

    return all;
  }

  getPrimarySource(): LegalSource {
    const sources = this.getSources();
    if (sources.length === 0) {
      throw new Error('Hech qanday faol manba topilmadi');
    }
    return sources[0];
  }

  updateLastChecked(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.lastChecked = new Date();
    }
  }
}
