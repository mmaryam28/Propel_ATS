import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';

@Module({
  controllers: [ResearchController],
})
export class ResearchModule {}
