import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(private prisma: PrismaService) {}

  async getPendingQueue() {
    return this.prisma.post.findMany({
      where: {
        status: {
          in: ['DRAFT', 'VERIFIED', 'PENDING_APPROVAL'],
        },
      },
      include: {
        author: { select: { fullName: true, username: true } },
        caseStudy: true,
        quiz: {
          include: {
            questions: { include: { options: true } },
          },
        },
        legalReferences: true,
        approvals: {
          include: { reviewer: { select: { fullName: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitForApproval(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post topilmadi');

    return this.prisma.post.update({
      where: { id: postId },
      data: { status: 'PENDING_APPROVAL' },
    });
  }

  async approvePost(postId: string, userId: string, comments?: string, editedContent?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post topilmadi');

    return this.prisma.$transaction(async (tx) => {
      // Record approval
      const approval = await tx.approval.create({
        data: {
          postId,
          reviewerId: userId,
          action: 'APPROVE',
          comments,
          contentSnapshot: post.content,
          editedContent: editedContent || null,
        },
      });

      // Update post status to APPROVED
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          status: 'APPROVED',
          editorId: userId,
          ...(editedContent && {
            content: editedContent,
            editedContent,
            editNotes: comments || 'Tahrirlandi va tasdiqlandi',
          }),
        },
      });

      // If associated with Case Study or Quiz, update their status too
      await tx.caseStudy.updateMany({
        where: { postId },
        data: { status: 'APPROVED' },
      });

      await tx.quiz.updateMany({
        where: { postId },
        data: { status: 'APPROVED' },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'post.approve',
          entityType: 'Post',
          entityId: postId,
          details: { comments, hasEdits: !!editedContent },
        },
      });

      this.logger.log(`Post tasdiqlandi (ID: ${postId}, Reviewer: ${userId})`);
      return { post: updatedPost, approval };
    });
  }

  async rejectPost(postId: string, userId: string, reason: string) {
    if (!reason) {
      throw new BadRequestException('Rad etish sababi ko‘rsatilishi shart');
    }

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post topilmadi');

    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.approval.create({
        data: {
          postId,
          reviewerId: userId,
          action: 'REJECT',
          comments: reason,
          contentSnapshot: post.content,
        },
      });

      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: { status: 'REJECTED' },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'post.reject',
          entityType: 'Post',
          entityId: postId,
          details: { reason },
        },
      });

      this.logger.log(`Post rad etildi (ID: ${postId}, Sabab: ${reason})`);
      return { post: updatedPost, approval };
    });
  }

  async editDraft(postId: string, userId: string, newContent: string, notes?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post topilmadi');

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        content: newContent,
        editedContent: newContent,
        editorId: userId,
        editNotes: notes,
      },
    });
  }
}
