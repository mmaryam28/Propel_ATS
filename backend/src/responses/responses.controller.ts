import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { PracticeSessionDto } from './dto/practice-session.dto';
import { RecordOutcomeDto } from './dto/record-outcome.dto';
import { AddTagsDto } from './dto/add-tags.dto';

@Controller('responses')
@UseGuards(AuthGuard('jwt'))
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('question_type') questionType?: string,
    @Query('question_category') questionCategory?: string,
    @Query('is_favorite') isFavorite?: string,
    @Query('tags') tags?: string,
  ) {
    const userId = req.user.userId;
    const filters: any = {};

    if (questionType) filters.question_type = questionType;
    if (questionCategory) filters.question_category = questionCategory;
    if (isFavorite !== undefined) filters.is_favorite = isFavorite === 'true';
    if (tags) filters.tags = tags.split(',');

    return this.responsesService.findAll(userId, filters);
  }

  @Get('gaps')
  async identifyGaps(@Req() req: any) {
    const userId = req.user.userId;
    return this.responsesService.identifyGaps(userId);
  }

  @Get('export')
  async exportPrepGuide(
    @Req() req: any,
    @Query('tags') tags?: string,
    @Query('question_type') questionType?: string,
  ) {
    const userId = req.user.userId;
    const filters: any = {};

    if (tags) filters.tags = tags.split(',');
    if (questionType) filters.question_type = questionType;

    return this.responsesService.exportPrepGuide(userId, filters);
  }

  @Get('suggest')
  async suggestForJob(
    @Req() req: any,
    @Query('job_id') jobId?: string,
    @Query('question') question?: string,
  ) {
    const userId = req.user.userId;
    if (!jobId) {
      return { error: 'job_id is required' };
    }
    return this.responsesService.suggestResponseForJob(userId, jobId, question);
  }

  @Get('search/tags')
  async searchByTags(@Req() req: any, @Query('tags') tags?: string) {
    const userId = req.user.userId;
    if (!tags) {
      return [];
    }
    const tagArray = tags.split(',');
    return this.responsesService.searchByTags(userId, tagArray);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.responsesService.findOne(userId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() createResponseDto: CreateResponseDto) {
    const userId = req.user.userId;
    return this.responsesService.create(userId, createResponseDto);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateResponseDto: UpdateResponseDto,
  ) {
    const userId = req.user.userId;
    return this.responsesService.update(userId, id, updateResponseDto);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.responsesService.delete(userId, id);
  }

  @Get(':id/versions')
  async getVersionHistory(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.responsesService.getVersionHistory(userId, id);
  }

  @Post(':id/versions/:versionId/restore')
  async restoreVersion(
    @Req() req: any,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    const userId = req.user.userId;
    return this.responsesService.restoreVersion(userId, id, versionId);
  }

  @Post(':id/tags')
  async addTags(
    @Req() req: any,
    @Param('id') id: string,
    @Body() addTagsDto: AddTagsDto,
  ) {
    const userId = req.user.userId;
    return this.responsesService.addTags(userId, id, addTagsDto);
  }

  @Delete(':id/tags')
  async removeTags(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { tag_ids: string[] },
  ) {
    const userId = req.user.userId;
    return this.responsesService.removeTags(userId, id, body.tag_ids);
  }

  @Post(':id/outcomes')
  async recordOutcome(
    @Req() req: any,
    @Param('id') id: string,
    @Body() recordOutcomeDto: RecordOutcomeDto,
  ) {
    const userId = req.user.userId;
    return this.responsesService.recordOutcome(userId, id, recordOutcomeDto);
  }

  @Get(':id/metrics')
  async getSuccessMetrics(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.responsesService.getSuccessMetrics(userId, id);
  }

  @Get(':id/practice')
  async getPracticeSessions(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.responsesService.getPracticeSessions(userId, id);
  }

  @Post(':id/practice')
  async createPracticeSession(
    @Req() req: any,
    @Param('id') id: string,
    @Body() practiceSessionDto: PracticeSessionDto,
  ) {
    const userId = req.user.userId;
    return this.responsesService.createPracticeSession(userId, id, practiceSessionDto);
  }
}
