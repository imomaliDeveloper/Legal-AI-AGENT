import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CaseStudyService } from './case-study.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Case Studies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('case-studies')
export class CaseStudyController {
  constructor(private readonly service: CaseStudyService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha kazuslar ro\'yxati' })
  async getAll(@Query('status') status?: string) {
    return this.service.getAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta kazus ma\'lumotlari' })
  async getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post('generate')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'AI yordamida yangi kazus generatsiya qilish' })
  async generate(
    @Body() body: { legalDomain: any; difficulty?: any; topic?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.generateCaseStudy({ ...body, userId });
  }
}
