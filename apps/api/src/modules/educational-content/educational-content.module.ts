import { Module } from '@nestjs/common';
import { EducationalContentService } from './educational-content.service';
import { EducationalContentController } from './educational-content.controller';

@Module({
  controllers: [EducationalContentController],
  providers: [EducationalContentService],
  exports: [EducationalContentService],
})
export class EducationalContentModule {}
