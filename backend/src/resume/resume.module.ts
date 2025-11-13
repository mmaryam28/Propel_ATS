import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/resumes', 
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService, PrismaService],
})
export class ResumeModule {}
