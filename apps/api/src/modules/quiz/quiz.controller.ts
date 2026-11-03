import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizController {
  constructor(private readonly service: QuizService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha viktorinalar ro\'yxati' })
  async getAll(@Query('status') status?: string) {
    return this.service.getAllQuizzes(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta viktorina va uning savollari' })
  async getOne(@Param('id') id: string) {
    return this.service.getQuiz(id);
  }

  @Post('generate')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'AI orqali yangi test/viktorina yaratish' })
  async generate(
    @Body() body: { legalDomain: any; difficulty?: any; topic?: string; questionCount?: number },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.generateQuiz({ ...body, userId });
  }
}
