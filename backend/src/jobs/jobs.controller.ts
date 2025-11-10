import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user.userId;
    return this.jobs.list(userId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateJobDto) {
    const userId = req.user.userId;
    return this.jobs.create(userId, dto);
  }
}
