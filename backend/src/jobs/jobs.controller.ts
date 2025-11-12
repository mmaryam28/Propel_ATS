import { Body, Controller, Get, Post, UseGuards, Req, Query, Patch, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobsService } from './jobs.service';
import { CreateJobDto, JOB_STATUSES } from './dto/create-job.dto';
import type { JobStatus } from './dto/create-job.dto';

import { UpdateJobDto } from './dto/update-job.dto';
import { ImportJobDto } from './dto/import-job.dto';
import { EnrichCompanyDto } from './dto/enrich-company.dto';


@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class JobsController {
  constructor(private jobs: JobsService) {}

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
    return this.jobs.create(userId, dto);
  }

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

  @Post('bulk-status')
  async bulkStatus(
    @Req() req: any,
    @Body('ids') ids: string[],
    @Body('status') status: JobStatus,
  ) {
    const userId = req.user.userId;
    return this.jobs.bulkUpdateStatus(userId, ids, status);
  }


  @Get(':id/history')
  async history(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getHistory(userId, id);
  }

  // UC-042: Materials history
  @Get(':id/materials-history')
  async materialsHistory(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getMaterialsHistory(userId, id);
  }

  @Post('import-from-url')
  async importFromUrl(@Body() dto: ImportJobDto) {
    return this.jobs.importFromUrl(dto.url);
  }

  @Post('enrich-company')
  async enrichCompany(@Body() dto: EnrichCompanyDto) {
    return this.jobs.enrichCompanyFromUrl(dto.url);
  }

  @Get(':id/company-news')
  async companyNews(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.jobs.getCompanyNews(userId, id);
  }

<<<<<<< HEAD
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

  @Post('bulk-archive')
  async bulkArchive(
    @Req() req: any,
    @Body('ids') ids: string[],
    @Body('reason') reason?: string,
  ) {
    const userId = req.user.userId;
    return this.jobs.bulkArchive(userId, ids, reason);
=======
  // UC-042: Materials usage analytics
  @Get('materials/usage')
  async materialsUsage(@Req() req: any) {
    const userId = req.user.userId;
    return this.jobs.getMaterialsUsage(userId);
  }

  // UC-042: User material defaults
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
>>>>>>> 4bf41d389fc79c0338c487000383ffb7619a6c84
  }
}
