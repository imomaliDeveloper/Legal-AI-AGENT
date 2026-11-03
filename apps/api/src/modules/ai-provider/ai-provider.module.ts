import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIProviderService } from './ai-provider.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AIProviderService],
  exports: [AIProviderService],
})
export class AIProviderModule {}
