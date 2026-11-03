import { Module } from '@nestjs/common';
import { SubscriberQuestionsService } from './subscriber-questions.service';
import { SubscriberQuestionsController } from './subscriber-questions.controller';

@Module({
  controllers: [SubscriberQuestionsController],
  providers: [SubscriberQuestionsService],
  exports: [SubscriberQuestionsService],
})
export class SubscriberQuestionsModule {}
