import { Body, Controller, Get, Post, UseGuards, Req, Query, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobsService } from './jobs.service';
import { CreateJobDto, JOB_STATUSES } from './dto/create-job.dto';
import type { JobStatus } from './dto/create-job.dto';

import { UpdateJobDto } from './dto/update-job.dto';
import { ImportJobDto } from './dto/import-job.dto';


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
  ) {
    const userId = req.user.userId;
    const s = status && JOB_STATUSES.includes(status as JobStatus) ? (status as JobStatus) : undefined;
    return this.jobs.list(userId, s, search, industry, location, salaryMin, salaryMax, deadlineFrom, deadlineTo, sortBy, sortOrder);
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

  @Post('import-from-url')
  async importFromUrl(@Body() dto: ImportJobDto) {
    return this.jobs.importFromUrl(dto.url);
  }
}
