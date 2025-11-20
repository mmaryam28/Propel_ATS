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
import { SupabaseModule } from './supabase/supabase.module';
import { ProfileModule } from './profile/profile.module';
import { EmploymentModule } from './employment/employment.module';
import { JobsModule } from './jobs/jobs.module';
import { ResumeModule } from './resume/resume.module';
import { CoverlettersModule } from './coverletters/coverletters.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ResearchModule } from './research/research.module';
import { MatchModule } from "./match/match.module";
import { SalaryModule } from './salary/salary.module';
import { InterviewModule } from './interview/interview.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'], // ensures backend/.env is loaded
    }),
    SupabaseModule,
    AuthModule,
    ApplicationsModule,
    EducationModule,
    CertificationModule,
  ProjectsModule,
  MailModule,
  SkillsModule,
  ProfileModule,
  EmploymentModule,
  JobsModule,
  ResumeModule,
  CoverlettersModule,
  StatisticsModule,
  ResearchModule,
  MatchModule,
  SalaryModule,
  InterviewModule
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
