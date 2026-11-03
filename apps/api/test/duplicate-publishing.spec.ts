import { PublishingService } from '../src/modules/publishing/publishing.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PublishingService - Strict Approval & Anti-Duplication', () => {
  let publishingService: PublishingService;
  let mockPrismaService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockPrismaService = {
      post: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      telegramPublication: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'TELEGRAM_CHANNEL_ID') return '@Huquq_study';
        return null;
      }),
    };

    publishingService = new PublishingService(mockPrismaService, mockConfigService);
  });

  it('CRITICAL: Should REJECT publishing a DRAFT post', async () => {
    mockPrismaService.post.findUnique.mockResolvedValue({
      id: 'post-1',
      title: 'Qoralama maqola',
      content: 'Matn...',
      status: 'DRAFT', // Not approved!
      publications: [],
    });

    await expect(
      publishingService.publishApprovedPost('post-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: Should PREVENT duplicate publishing if already published', async () => {
    mockPrismaService.post.findUnique.mockResolvedValue({
      id: 'post-2',
      title: 'Allaqachon chiqqan post',
      content: 'Matn...',
      status: 'APPROVED',
      publications: [
        { id: 'pub-1', isSuccessful: true, messageId: '12345' },
      ],
    });

    await expect(
      publishingService.publishApprovedPost('post-2'),
    ).rejects.toThrow('Ushbu post allaqachon Telegram kanalga muvaffaqiyatli nashr qilingan!');
  });

  it('Should successfully publish APPROVED post without prior publications', async () => {
    const post = {
      id: 'post-3',
      title: 'Tasdiqlangan Yangilik',
      content: 'Rasmiy matn...',
      type: 'NEWS',
      status: 'APPROVED',
      publications: [],
    };

    mockPrismaService.post.findUnique.mockResolvedValue(post);
    mockPrismaService.post.update.mockResolvedValue({
      ...post,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    const published = await publishingService.publishApprovedPost('post-3');
    expect(published.status).toBe('PUBLISHED');
  });
});
