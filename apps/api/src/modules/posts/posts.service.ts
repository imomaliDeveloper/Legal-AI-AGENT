import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    status?: any;
    type?: any;
    domain?: any;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.domain) where.legalDomain = query.domain;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { fullName: true, username: true } },
          legalReferences: true,
          approvals: { take: 1, orderBy: { createdAt: 'desc' } },
          publications: true,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { fullName: true, username: true } },
        editor: { select: { fullName: true, username: true } },
        legalReferences: true,
        mediaAssets: true,
        caseStudy: true,
        quiz: {
          include: { questions: { include: { options: true } } },
        },
        approvals: {
          include: { reviewer: { select: { fullName: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        publications: true,
        scheduledPubs: true,
      },
    });

    if (!post) throw new NotFoundException('Post topilmadi');
    return post;
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
