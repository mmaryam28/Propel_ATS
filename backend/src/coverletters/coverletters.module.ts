import { Module } from '@nestjs/common';
import { CoverlettersController } from './coverletters.controller';
import { CoverlettersService } from './coverletters.service';
import { CoverletterAIService } from './coverletters.ai.service';

@Module({
  controllers: [CoverlettersController],
  providers: [CoverlettersService, CoverletterAIService],
})
export class CoverlettersModule {}
