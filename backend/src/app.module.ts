import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { EducationModule } from './education/education.module';
import { CertificationModule } from './certification/certification.module';
import { ProjectsModule } from './projects/projects.module';
import { MailModule } from './mail/mail.module';
import { SkillsModule } from './skills/skills.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // ensures backend/.env is loaded
    }),
    AuthModule,
    ApplicationsModule,
    EducationModule,
    CertificationModule,
    ProjectsModule,
    MailModule,
    SkillsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [AppService, PrismaService],
})
export class AppModule {}
