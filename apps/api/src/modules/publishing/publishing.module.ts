import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PublishingService } from './publishing.service';
import { PublishingController } from './publishing.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
