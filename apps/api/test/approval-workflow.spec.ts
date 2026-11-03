import { ApprovalService } from '../src/modules/approval/approval.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ApprovalWorkflow', () => {
  let approvalService: ApprovalService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      post: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      approval: {
        create: jest.fn(),
      },
      caseStudy: {
        updateMany: jest.fn(),
      },
      quiz: {
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    approvalService = new ApprovalService(mockPrismaService);
  });

  it('should prevent approving a non-existent post', async () => {
    mockPrismaService.post.findUnique.mockResolvedValue(null);

    await expect(
      approvalService.approvePost('invalid-id', 'admin-1', 'Tasdiq'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should approve post and transition state from DRAFT to APPROVED', async () => {
    const mockPost = {
      id: 'post-123',
      title: 'Yangi Mehnat kodeksi',
      content: 'Mehnat munosabatlari...',
      status: 'DRAFT',
    };

    mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
    mockPrismaService.post.update.mockResolvedValue({
      ...mockPost,
      status: 'APPROVED',
    });
    mockPrismaService.approval.create.mockResolvedValue({
      id: 'app-1',
      postId: 'post-123',
      action: 'APPROVE',
    });

    const result = await approvalService.approvePost('post-123', 'admin-1', 'Yaxshi post');

    expect(result.post.status).toBe('APPROVED');
    expect(mockPrismaService.approval.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postId: 'post-123',
          action: 'APPROVE',
          reviewerId: 'admin-1',
        }),
      }),
    );
  });

  it('should require a reason when rejecting a post', async () => {
    await expect(
      approvalService.rejectPost('post-123', 'admin-1', ''),
    ).rejects.toThrow(BadRequestException);
  });

  it('should transition post to REJECTED with reason recorded', async () => {
    const mockPost = {
      id: 'post-123',
      status: 'PENDING_APPROVAL',
      content: 'Test content',
    };

    mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
    mockPrismaService.post.update.mockResolvedValue({
      ...mockPost,
      status: 'REJECTED',
    });

    const result = await approvalService.rejectPost(
      'post-123',
      'admin-1',
      'Modda raqami xato ko‘rsatilgan',
    );

    expect(result.post.status).toBe('REJECTED');
  });
});
