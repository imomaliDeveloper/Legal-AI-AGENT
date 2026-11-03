import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalPosts,
      publishedPosts,
      pendingApproval,
      rejectedPosts,
      failedPosts,
      subscribersCount,
      questionsCount,
      quizzesCount,
      caseStudiesCount,
      aiExecutionsCount,
    ] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.post.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.post.count({ where: { status: 'REJECTED' } }),
      this.prisma.post.count({ where: { status: 'FAILED' } }),
      this.prisma.subscriber.count(),
      this.prisma.subscriberQuestion.count(),
      this.prisma.quiz.count(),
      this.prisma.caseStudy.count(),
      this.prisma.aIExecution.count(),
    ]);

    // Group posts by type
    const postsByType = await this.prisma.post.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    // Group posts by legal domain
    const postsByDomain = await this.prisma.post.groupBy({
      by: ['legalDomain'],
      _count: { id: true },
    });

    // AI performance metrics
    const aiSuccessCount = await this.prisma.aIExecution.count({ where: { isSuccessful: true } });
    const aiFailureCount = await this.prisma.aIExecution.count({ where: { isSuccessful: false } });

    // Recent publishing logs
    const recentPublications = await this.prisma.telegramPublication.findMany({
      take: 5,
      orderBy: { publishedAt: 'desc' },
      include: { post: { select: { title: true, type: true } } },
    });

    return {
      totals: {
        totalPosts,
        publishedPosts,
        pendingApproval,
        rejectedPosts,
        failedPosts,
        subscribersCount,
        questionsCount,
        quizzesCount,
        caseStudiesCount,
        aiExecutionsCount,
      },
      distribution: {
        byType: postsByType.map((p) => ({ type: p.type, count: p._count.id })),
        byDomain: postsByDomain.map((p) => ({ domain: p.legalDomain, count: p._count.id })),
      },
      aiPerformance: {
        total: aiExecutionsCount,
        successful: aiSuccessCount,
        failed: aiFailureCount,
        successRate: aiExecutionsCount > 0 ? ((aiSuccessCount / aiExecutionsCount) * 100).toFixed(1) + '%' : '100%',
      },
      recentPublications,
    };
  }
}
