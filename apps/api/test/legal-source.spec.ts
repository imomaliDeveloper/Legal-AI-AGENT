import { SourceRegistry } from '@legal-aid-ai/legal-research';

describe('Legal Research & Source Registry', () => {
  let registry: SourceRegistry;

  beforeEach(() => {
    registry = new SourceRegistry();
  });

  it('should have Lex.uz configured as the primary official source', () => {
    const primary = registry.getPrimarySource();
    expect(primary).toBeDefined();
    expect(primary.baseUrl).toBe('https://lex.uz');
    expect(primary.type).toBe('official');
    expect(primary.isActive).toBe(true);
  });

  it('should allow registering secondary sources with distinct priorities', () => {
    registry.addSource({
      id: 'adliya-uz',
      name: 'Adliya Vazirligi',
      baseUrl: 'https://adliya.uz',
      type: 'official',
      isActive: true,
      priority: 2,
    });

    const sources = registry.getSources();
    expect(sources.length).toBeGreaterThanOrEqual(2);
    expect(registry.getSource('adliya-uz')).toBeDefined();
  });

  it('should differentiate official legislation from non-official sources', () => {
    registry.addSource({
      id: 'legal-blog',
      name: 'Yuridik Blog',
      baseUrl: 'https://blog.uz',
      type: 'news',
      isActive: true,
      priority: 10,
    });

    const officialSources = registry.getSources('official');
    const newsSources = registry.getSources('news');

    expect(officialSources.every((s) => s.type === 'official')).toBe(true);
    expect(newsSources.every((s) => s.type === 'news')).toBe(true);
  });
});
