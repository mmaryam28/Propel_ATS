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
import { GoalsModule } from './goals/goals.module';
import { MarketModule } from './market/market.module';
import { CompetitiveModule } from './competitive/competitive.module';
import { ProductivityModule } from './productivity/productivity.module';
import { NetworkingModule } from './networking/networking.module';
import { PatternsModule } from './patterns/patterns.module';
import { LinkedinAuthModule } from './linkedin-auth/linkedin-auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { ReferralsModule } from './referrals/referrals.module';
import { NetworkingEventsModule } from './networking-events/networking-events.module';
import { InformationalInterviewsModule } from './informational-interviews/informational-interviews.module';
import { ReferencesModule } from './references/references.module';
import { RelationshipMaintenanceModule } from './relationship-maintenance/relationship-maintenance.module';
import { TeamsModule } from './teams/teams.module';
import { MentorsModule } from './mentors/mentors.module';
import { GitHubModule } from './github/github.module';
import { AbTestingModule } from './ab-testing/ab-testing.module';
import { ApplicationQualityModule } from './application-quality/application-quality.module';
import { ExternalCertificationsModule } from './external-certifications/external-certifications.module';
import { EmailIntegrationModule } from './email-integration/email-integration.module';

import { TimingOptimizerModule } from './timing-optimizer/timing-optimizer.module';
import { ApiMonitoringModule } from './api-monitoring/api-monitoring.module';

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
  InterviewModule,
  GoalsModule,
  MarketModule,
  CompetitiveModule,
  ProductivityModule,
  NetworkingModule,
  PatternsModule,
  LinkedinAuthModule,
  ContactsModule,
  ReferralsModule,
  NetworkingEventsModule,
  InformationalInterviewsModule,
  ReferencesModule,
  RelationshipMaintenanceModule,
  TeamsModule,
  MentorsModule,
  GitHubModule,
  AbTestingModule,
  ApplicationQualityModule,
  ExternalCertificationsModule,
  EmailIntegrationModule,
  TimingOptimizerModule,
    ApiMonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
