import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { PublishingModule } from '../publishing/publishing.module';
import { EducationalContentModule } from '../educational-content/educational-content.module';
import { QuizModule } from '../quiz/quiz.module';
import { CaseStudyModule } from '../case-study/case-study.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    PublishingModule,
    EducationalContentModule,
    QuizModule,
    CaseStudyModule,
    NewsModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
