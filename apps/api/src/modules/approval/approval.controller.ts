import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Approval Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Tasdiqlash navbatidagi barcha postlar' })
  async getQueue() {
    return this.approvalService.getPendingQueue();
  }

  @Post(':id/submit')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Postni tasdiqlash uchun yuborish' })
  async submit(@Param('id') id: string) {
    return this.approvalService.submitForApproval(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Postni tasdiqlash (faqat Administrator)' })
  async approve(
    @Param('id') id: string,
    @Body() body: { comments?: string; editedContent?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.approvalService.approvePost(id, userId, body.comments, body.editedContent);
  }

  @Post(':id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Postni rad etish (faqat Administrator)' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.approvalService.rejectPost(id, userId, reason);
  }

  @Post(':id/edit')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Post qoralamasini tahrirlash' })
  async edit(
    @Param('id') id: string,
    @Body() body: { content: string; notes?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.approvalService.editDraft(id, userId, body.content, body.notes);
  }
}
