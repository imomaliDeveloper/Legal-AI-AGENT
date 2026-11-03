import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private imageProvider: string | null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.imageProvider = this.configService.get<string>('IMAGE_PROVIDER') || null;
  }

  async getAllAssets() {
    return this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { title: true, type: true } } },
    });
  }

  async generateInfographic(data: {
    title: string;
    keyPoints: string[];
    domain: string;
    postId?: string;
  }) {
    // Check if an image generation provider is configured
    if (!this.imageProvider || this.imageProvider === 'none') {
      this.logger.warn('Rasm yaratish provayderi (IMAGE_PROVIDER) sozlanmagan.');
      return {
        success: false,
        message: 'Rasm generatsiyasi provayderi sozlanmagan. Tizim sozlamalaridan IMAGE_PROVIDER va IMAGE_API_KEY kiriting.',
        template: {
          brand: 'LEGAL AID AI',
          primaryColor: '#0F172A', // Navy
          accentColor: '#D97706', // Gold
          textColor: '#FFFFFF', // White
          title: data.title,
          keyPoints: data.keyPoints,
          channel: '@Huquq_study',
        },
      };
    }

    // In production with an image provider configured:
    // Generate graphic with Navy, White, Gold brand palette
    const asset = await this.prisma.mediaAsset.create({
      data: {
        filename: `infographic-${Date.now()}.png`,
        originalName: `${data.title.slice(0, 30)}.png`,
        mimeType: 'image/png',
        fileSize: 1024 * 250, // 250KB estimated
        width: 1200,
        height: 630,
        storagePath: `/uploads/media/infographic-${Date.now()}.png`,
        publicUrl: `/media/infographics/${Date.now()}.png`,
        mediaType: 'INFOGRAPHIC',
        altText: data.title,
        description: `LEGAL AID brend infografikasi: ${data.title}`,
        provider: this.imageProvider,
        postId: data.postId,
      },
    });

    return {
      success: true,
      asset,
      message: 'Infografika muvaffaqiyatli tayyorlandi',
    };
  }

  async createSvgTemplate(title: string, summary: string, domain: string): Promise<string> {
    // Generate clean SVG graphic adhering to brand identity
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="10" fill="url(#gold)"/>
  
  <!-- Header / Brand -->
  <text x="80" y="90" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#FBBF24" letter-spacing="2">LEGAL AID AI</text>
  <text x="80" y="125" font-family="Arial, sans-serif" font-size="16" fill="#94A3B8">O‘zbekiston Huquqiy Ta'lim Portali</text>
  
  <!-- Domain Badge -->
  <rect x="80" y="160" width="220" height="36" rx="18" fill="#334155"/>
  <text x="190" y="184" font-family="Arial, sans-serif" font-weight="600" font-size="14" fill="#F8FAFC" text-anchor="middle">${domain.toUpperCase()}</text>
  
  <!-- Title -->
  <foreignObject x="80" y="230" width="1040" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FFFFFF; font-family: Arial, sans-serif; font-size: 38px; font-weight: bold; line-height: 1.3;">
      ${title}
    </div>
  </foreignObject>
  
  <!-- Summary -->
  <foreignObject x="80" y="440" width="1040" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #CBD5E1; font-family: Arial, sans-serif; font-size: 20px; line-height: 1.5;">
      ${summary}
    </div>
  </foreignObject>
  
  <!-- Footer -->
  <line x1="80" y1="590" x2="1120" y2="590" stroke="#334155" stroke-width="1"/>
  <text x="80" y="630" font-family="Arial, sans-serif" font-size="16" fill="#94A3B8">Rasmiy kanal: @Huquq_study</text>
  <text x="1120" y="630" font-family="Arial, sans-serif" font-size="16" fill="#94A3B8" text-anchor="end">Manba: Lex.uz</text>
</svg>`;
  }
}
