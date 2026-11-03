import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PublishingService } from './publishing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Publishing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('publishing')
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Get('history')
  @ApiOperation({ summary: 'Telegram kanaliga nashrlar tarixi' })
  async getHistory() {
    return this.publishingService.getPublicationHistory();
  }

  @Post(':id/publish-now')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tasdiqlangan postni zudlik bilan Telegram kanaliga nashr etish' })
  async publishNow(@Param('id') id: string) {
    return this.publishingService.publishApprovedPost(id);
  }
}
