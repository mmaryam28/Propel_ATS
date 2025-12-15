import { Body, Controller, Get, Post, UseGuards, Req, Query, Patch, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobsService } from './jobs.service';
import { CreateJobDto, JOB_STATUSES } from './dto/create-job.dto';
import type { JobStatus } from './dto/create-job.dto';

import { UpdateJobDto } from './dto/update-job.dto';
import { ImportJobDto } from './dto/import-job.dto';
import { EnrichCompanyDto } from './dto/enrich-company.dto';
import { SalaryService } from '../salary/salary.service';


@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class JobsController {
  constructor(private jobs: JobsService, private salaryService: SalaryService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('industry') industry?: string,
    @Query('location') location?: string,
    @Query('salaryMin') salaryMin?: string,
    @Query('salaryMax') salaryMax?: string,
    @Query('deadlineFrom') deadlineFrom?: string,
    @Query('deadlineTo') deadlineTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('archived') archived?: string,
  ) {
    const userId = req.user.userId;
    const s = status && JOB_STATUSES.includes(status as JobStatus) ? (status as JobStatus) : undefined;
    const showArchived = archived === 'true';
    return this.jobs.list(userId, s, search, industry, location, salaryMin, salaryMax, deadlineFrom, deadlineTo, sortBy, sortOrder, showArchived);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateJobDto) {
    const userId = req.user.userId;
    console.log('CONTROLLER: Raw body source:', req.body?.source);
    console.log('CONTROLLER: DTO source:', dto.source);
    console.log('CONTROLLER: Full DTO:', dto);
    return this.jobs.create(userId, dto);
  }

  // ✅ Move ALL interview routes BEFORE @Get(':id')
  // Interview Scheduling
  @Post('interviews')
  async scheduleInterview(@Req() req: any, @Body() dto: any) {
    const userId = req.user.userId;
    return this.jobs.scheduleInterview(userId, dto);
  }

  @Get('interviews')
  async getInterviews(@Req() req: any, @Query('jobId') jobId?: string) {
    const userId = req.user.userId;
    return this.jobs.getInterviews(userId, jobId);
  }

  @Patch('interviews/:id')
  async updateInterview(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const userId = req.user.userId;
    return this.jobs.updateInterview(userId, id, dto);
  }

  @Delete('interviews/:id')
  async deleteInterview(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.deleteInterview(userId, id);
  }

  // ✅ Move analytics routes BEFORE @Get(':id')
  @Get('analytics')
  async getAnalytics(@Req() req: any) {
    const userId = req.user.userId;
    return this.jobs.getAnalytics(userId);
  }

  // ✅ Move automation rules BEFORE @Get(':id')
  @Post('automation-rules')
  async createAutomationRule(@Req() req: any, @Body() dto: any) {
    const userId = req.user.userId;
    return this.jobs.createAutomationRule(userId, dto);
  }

  @Get('automation-rules')
  async getAutomationRules(@Req() req: any) {
    const userId = req.user.userId;
    return this.jobs.getAutomationRules(userId);
  }

  @Patch('automation-rules/:id')
  async updateAutomationRule(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const userId = req.user.userId;
    return this.jobs.updateAutomationRule(userId, id, dto);
  }

  @Delete('automation-rules/:id')
  async deleteAutomationRule(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.deleteAutomationRule(userId, id);
  }

  // ✅ Move ALL specific routes BEFORE the generic :id route
  @Post('bulk-status')
  async bulkStatus(
    @Req() req: any,
    @Body('ids') ids: string[],
    @Body('status') status: JobStatus,
  ) {
    const userId = req.user.userId;
    return this.jobs.bulkUpdateStatus(userId, ids, status);
  }

  @Post('import-from-url')
  async importFromUrl(@Body() dto: ImportJobDto) {
    return this.jobs.importFromUrl(dto.url);
  }

  @Post('enrich-company')
  async enrichCompany(@Body() dto: EnrichCompanyDto) {
    return this.jobs.enrichCompanyFromUrl(dto.url);
  }

  @Post('bulk-archive')
  async bulkArchive(
    @Req() req: any,
    @Body('ids') ids: string[],
    @Body('reason') reason?: string,
  ) {
    const userId = req.user.userId;
    return this.jobs.bulkArchive(userId, ids, reason);
  }

  @Get('materials/usage')
  async materialsUsage(@Req() req: any) {
    const userId = req.user.userId;
    return this.jobs.getMaterialsUsage(userId);
  }

  // UC-112: Salary benchmarks for job title and location
  @Get('salary-benchmarks')
  async getSalaryBenchmarks(
    @Query('jobTitle') jobTitle: string,
    @Query('location') location: string,
  ) {
    if (!jobTitle || !location) {
      return { error: 'Missing required parameters: jobTitle, location' };
    }
    return await this.salaryService.getSalaryBenchmarks(jobTitle, location);
  }

  @Get('materials/defaults')
  async getMaterialDefaults(@Req() req: any) {
    const userId = req.user.userId;
    return this.jobs.getUserMaterialDefaults(userId);
  }

  @Post('materials/defaults')
  async setMaterialDefaults(
    @Req() req: any,
    @Body('defaultResumeVersionId') defaultResumeVersionId?: string | null,
    @Body('defaultCoverLetterVersionId') defaultCoverLetterVersionId?: string | null,
  ) {
    const userId = req.user.userId;
    return this.jobs.setUserMaterialDefaults(userId, { defaultResumeVersionId, defaultCoverLetterVersionId });
  }

  // ⚠️ NOW put the generic :id routes at the END
  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getById(userId, id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateJobDto) {
    const userId = req.user.userId;
    return this.jobs.update(userId, id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: JobStatus,
  ) {
    const userId = req.user.userId;
    return this.jobs.updateStatus(userId, id, status);
  }

  @Get(':id/history')
  async history(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getHistory(userId, id);
  }

  @Get(':id/materials-history')
  async materialsHistory(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getMaterialsHistory(userId, id);
  }

  @Get(':id/company-news')
  async companyNews(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getCompanyNews(userId, id);
  }

  @Patch(':id/archive')
  async archive(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const userId = req.user.userId;
    return this.jobs.archive(userId, id, reason);
  }

  @Patch(':id/restore')
  async restore(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.restore(userId, id);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.delete(userId, id);
  }

  // Job Skills Management
  @Get(':id/skills')
  async getJobSkills(@Req() req: any, @Param('id') jobId: string) {
    const userId = req.user.userId;
    return this.jobs.getJobSkills(userId, jobId);
  }

  @Post(':id/skills')
  async addJobSkill(
    @Req() req: any,
    @Param('id') jobId: string,
    @Body() body: { skillId: string; reqLevel?: number; weight?: number }
  ) {
    const userId = req.user.userId;
    return this.jobs.addJobSkill(userId, jobId, body.skillId, body.reqLevel, body.weight);
  }

  @Delete(':id/skills/:skillName')
  async removeJobSkill(
    @Req() req: any,
    @Param('id') jobId: string,
    @Param('skillName') skillName: string
  ) {
    const userId = req.user.userId;
    return this.jobs.removeJobSkill(userId, jobId, decodeURIComponent(skillName));
  }

  @Patch(':id/skills/:skillName')
  async updateJobSkill(
    @Req() req: any,
    @Param('id') jobId: string,
    @Param('skillName') skillName: string,
    @Body() body: { reqLevel?: number; weight?: number }
  ) {
    const userId = req.user.userId;
    return this.jobs.updateJobSkill(userId, jobId, decodeURIComponent(skillName), body.reqLevel, body.weight);
  }
}
