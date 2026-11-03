import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EducationalContentService } from './educational-content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Educational Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('educational-content')
export class EducationalContentController {
  constructor(private readonly service: EducationalContentService) {}

  @Get()
  @ApiOperation({ summary: 'Ta\'limiy maqolalar ro\'yxatini olish' })
  async getAll(@Query('domain') domain?: string, @Query('status') status?: string) {
    return this.service.getAllArticles(domain, status);
  }

  @Post('generate')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'AI orqali yangi ta\'limiy maqola generatsiya qilish' })
  async generate(
    @Body() body: { legalDomain: any; topic: string; difficulty?: any },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.generateArticle({ ...body, userId });
  }
}
