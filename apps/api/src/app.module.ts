import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AIProviderModule } from './modules/ai-provider/ai-provider.module';
import { LegalResearchModule } from './modules/legal-research/legal-research.module';
import { NewsModule } from './modules/news/news.module';
import { EducationalContentModule } from './modules/educational-content/educational-content.module';
import { CaseStudyModule } from './modules/case-study/case-study.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { MediaModule } from './modules/media/media.module';
import { SubscriberQuestionsModule } from './modules/subscriber-questions/subscriber-questions.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    AIProviderModule,
    LegalResearchModule,
    NewsModule,
    EducationalContentModule,
    CaseStudyModule,
    QuizModule,
    MediaModule,
    SubscriberQuestionsModule,
    ApprovalModule,
    PublishingModule,
    SchedulerModule,
    AnalyticsModule,
    AuditModule,
    SettingsModule,
    TelegramModule,
  ],
})
export class AppModule {}
