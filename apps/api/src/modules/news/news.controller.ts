import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Legal News')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha yangilik postlarini olish' })
  async getAll(@Query('status') status?: string) {
    return this.newsService.getAllNews(status);
  }

  @Post('generate')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'AI yordamida yangilik posti generatsiya qilish' })
  async generate(
    @Body() body: { documentId?: string; topic?: string; rawContent?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.newsService.generateNewsPost({ ...body, userId });
  }
}
