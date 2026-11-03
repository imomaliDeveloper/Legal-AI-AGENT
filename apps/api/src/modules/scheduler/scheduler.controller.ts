import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Scheduler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('mode')
  @ApiOperation({ summary: 'Avtonom rejim holatini olish (1 = Yarim avtomat, 2 = To‘liq avtopilot)' })
  async getMode() {
    const mode = await this.schedulerService.getAutonomousMode();
    return {
      mode,
      description: mode === '2' ? 'Mode 2: To‘liq Avtopilot (Avtomatik nashr)' : 'Mode 1: Yarim avtomat (Tasdiqlash bilan)',
    };
  }

  @Post('mode')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Avtonom rejimni o‘zgartirish (1 yoki 2)' })
  async setMode(@Body() body: { mode: '1' | '2' }) {
    const mode = await this.schedulerService.setAutonomousMode(body.mode);
    return {
      success: true,
      mode,
      message: mode === '2' ? 'Mode 2: To‘liq Avtopilot faollashtirildi' : 'Mode 1: Yarim avtomat faollashtirildi',
    };
  }

  @Get('times')
  @ApiOperation({ summary: 'Dinamik avtopilot vaqtlari (Cron sozlamalari)' })
  async getTimes() {
    return this.schedulerService.getScheduleSettings();
  }

  @Post('times')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Dinamik avtopilot vaqtlarini o‘zgartirish' })
  async updateTimes(
    @Body()
    body: {
      morningTime?: string;
      lunchTime?: string;
      eveningTime?: string;
      sundayBlitzTime?: string;
      isEnabled?: boolean;
    },
  ) {
    return this.schedulerService.updateScheduleSettings(body);
  }

  @Post('autopilot/run')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Avtopilot siklini qo‘lda darhol ishga tushirish' })
  async runAutopilot(@Body() body?: { type?: 'QUIZ' | 'EDUCATIONAL' | 'CASE_STUDY' | 'NEWS' }) {
    return this.schedulerService.runAutopilotCycle(body?.type);
  }

  @Post('blitz/run')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Haftalik 5 talik quiz blitsini qo‘lda darhol ishga tushirish' })
  async runBlitz() {
    return this.schedulerService.runSundayWeeklyQuizBlitz();
  }

  @Get('queue')
  @ApiOperation({ summary: 'Rejalashtirilgan nashrlar navbati' })
  async getQueue() {
    return this.schedulerService.getScheduledQueue();
  }

  @Post('schedule')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Postni ma\'lum vaqtga rejalashtirish' })
  async schedulePost(
    @Body() body: { postId: string; scheduledFor: string; timezone?: string },
  ) {
    return this.schedulerService.schedulePost(
      body.postId,
      new Date(body.scheduledFor),
      body.timezone,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rejalashtirilgan postni bekor qilish' })
  async cancel(@Param('id') id: string) {
    return this.schedulerService.cancelScheduled(id);
  }
}
