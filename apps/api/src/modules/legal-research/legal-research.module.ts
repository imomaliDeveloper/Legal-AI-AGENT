import { Module } from '@nestjs/common';
import { LegalResearchService } from './legal-research.service';
import { LegalResearchController } from './legal-research.controller';

@Module({
  controllers: [LegalResearchController],
  providers: [LegalResearchService],
  exports: [LegalResearchService],
})
export class LegalResearchModule {}
