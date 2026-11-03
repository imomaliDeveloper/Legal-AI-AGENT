import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriberQuestionsService } from './subscriber-questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscriber Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriber-questions')
export class SubscriberQuestionsController {
  constructor(private readonly service: SubscriberQuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Obunachilar savollari ro\'yxati' })
  async getAll(@Query('status') status?: string) {
    return this.service.getAllQuestions(status);
  }

  @Post(':id/review')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Savol javobini ko\'rib chiqish va tasdiqlash' })
  async review(
    @Param('id') id: string,
    @Body('finalResponse') finalResponse: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.reviewAndSendAnswer(id, finalResponse, userId);
  }
}
