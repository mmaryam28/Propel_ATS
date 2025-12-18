import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { MergeDuplicatesDto } from './dto/merge-duplicates.dto';

@Controller('duplicates')
@UseGuards(JwtAuthGuard)
export class DuplicatesController {
  constructor(private duplicateService: DuplicateDetectionService) {}

  // Detect duplicates for a job
  @Post('detect/:jobId')
  async detectDuplicates(@Request() req, @Param('jobId') jobId: string) {
    console.log('POST /duplicates/detect/:jobId', { jobId });
    return this.duplicateService.findPotentialDuplicates(req.user.userId, jobId);
  }

  // Get all pending duplicates for user
  @Get('pending')
  async getPendingDuplicates(@Request() req) {
    return this.duplicateService.getPendingDuplicates(req.user.userId);
  }

  // Merge duplicate jobs
  @Post('merge')
  async mergeDuplicates(@Request() req, @Body() mergeData: MergeDuplicatesDto) {
    console.log('POST /duplicates/merge', { mergeData });
    return this.duplicateService.mergeDuplicates(req.user.userId, mergeData);
  }

  // Dismiss duplicate suggestion
  @Post('dismiss/:duplicateId')
  async dismissDuplicate(
    @Request() req,
    @Param('duplicateId') duplicateId: string,
  ) {
    return this.duplicateService.dismissDuplicate(req.user.userId, duplicateId);
  }
}
