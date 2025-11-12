import { Module } from '@nestjs/common';
import { CoverlettersController } from './coverletters.controller';
import { CoverlettersService } from './coverletters.service';

@Module({
  controllers: [CoverlettersController],
  providers: [CoverlettersService],
})
export class CoverlettersModule {}
