import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Barcha tizim sozlamalarini olish' })
  async getAll() {
    return this.settingsService.getAllSettings();
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tizim sozlamasini saqlash yoki yangilash' })
  async set(
    @Body() body: { key: string; value: string; description?: string; category?: string; isSecret?: boolean },
  ) {
    return this.settingsService.setSetting(
      body.key,
      body.value,
      body.description,
      body.category,
      body.isSecret,
    );
  }
}
