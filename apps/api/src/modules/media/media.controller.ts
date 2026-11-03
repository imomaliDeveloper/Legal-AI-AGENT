import { Controller, Get, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Media Studio')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('assets')
  @ApiOperation({ summary: 'Barcha media aktivlar ro\'yxati' })
  async getAssets() {
    return this.mediaService.getAllAssets();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Post('infographic')
  @ApiOperation({ summary: 'Infografika generatsiya qilish' })
  async generateInfographic(
    @Body() body: { title: string; keyPoints: string[]; domain: string; postId?: string },
  ) {
    return this.mediaService.generateInfographic(body);
  }

  @Public()
  @Get('template/svg')
  @ApiOperation({ summary: 'Brend SVG shablonini olish' })
  async getSvg(
    @Param('title') title: string,
    @Param('summary') summary: string,
    @Param('domain') domain: string,
    @Res() res: Response,
  ) {
    const svg = await this.mediaService.createSvgTemplate(
      title || 'LEGAL AID AI - O‘zbekiston Qonunchiligi',
      summary || 'Huquqiy ta\'lim va qonun yangiliklari tahlili.',
      domain || 'HUQUQ',
    );
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
}
