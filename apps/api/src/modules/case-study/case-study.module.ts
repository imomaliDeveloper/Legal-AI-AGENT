import { Module } from '@nestjs/common';
import { CaseStudyService } from './case-study.service';
import { CaseStudyController } from './case-study.controller';

@Module({
  controllers: [CaseStudyController],
  providers: [CaseStudyService],
  exports: [CaseStudyService],
})
export class CaseStudyModule {}
