import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LegalResearchService } from './legal-research.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Legal Research')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('legal-research')
export class LegalResearchController {
  constructor(private readonly researchService: LegalResearchService) {}

  @Get('sources')
  @ApiOperation({ summary: 'Barcha qonun manbalari ro\'yxati' })
  async getSources() {
    return this.researchService.getSources();
  }

  @Post('sources')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Yangi huquqiy manba qo\'shish' })
  async addSource(@Body() data: any) {
    return this.researchService.addSource(data);
  }

  @Get('search')
  @ApiOperation({ summary: 'Huquqiy hujjatlar bo\'yicha qidiruv' })
  async search(@Query('q') query: string) {
    return this.researchService.searchDocuments(query || '');
  }

  @Post('discover')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Yangi qonun hujjatlarini aniqlash (Lex.uz skan)' })
  async discover() {
    return this.researchService.discoverNewDocuments();
  }

  @Post('documents/:id/verify')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Huquqiy hujjatni tasdiqlash' })
  async verifyDocument(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.researchService.verifyDocument(id, notes);
  }
}
