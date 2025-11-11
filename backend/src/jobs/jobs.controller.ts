import { Body, Controller, Get, Post, UseGuards, Req, Query, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobsService } from './jobs.service';
import { CreateJobDto, JOB_STATUSES } from './dto/create-job.dto';
import type { JobStatus } from './dto/create-job.dto';

@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Get()
  async list(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user.userId;
    const s = status && JOB_STATUSES.includes(status as JobStatus) ? (status as JobStatus) : undefined;
    return this.jobs.list(userId, s);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateJobDto) {
    const userId = req.user.userId;
    return this.jobs.create(userId, dto);
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
}
