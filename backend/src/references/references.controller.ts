import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReferencesService } from './references.service';
import { CreateReferenceDto, UpdateReferenceDto, CreateReferenceRequestDto, UpdateReferenceRequestDto } from './dto/reference.dto';

@Controller('references')
@UseGuards(AuthGuard('jwt'))
export class ReferencesController {
  constructor(private referencesService: ReferencesService) {}

  // References CRUD
  @Get()
  async getAllReferences(@Request() req) {
    return this.referencesService.getAllReferences(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.referencesService.getReferenceStats(req.user.userId);
  }

  @Get('impact')
  async getImpact(@Request() req) {
    return this.referencesService.getReferenceImpact(req.user.userId);
  }

  @Get('interested-jobs')
  async getInterestedJobs(@Request() req) {
    return this.referencesService.getInterestedJobs(req.user.userId);
  }

  @Get(':id')
  async getReferenceById(@Request() req, @Param('id') id: string) {
    return this.referencesService.getReferenceById(req.user.userId, id);
  }

  @Post()
  async createReference(@Request() req, @Body() dto: CreateReferenceDto) {
    return this.referencesService.createReference(req.user.userId, dto);
  }

  @Put(':id')
  async updateReference(@Request() req, @Param('id') id: string, @Body() dto: UpdateReferenceDto) {
    return this.referencesService.updateReference(req.user.userId, id, dto);
  }

  @Delete(':id')
  async deleteReference(@Request() req, @Param('id') id: string) {
    return this.referencesService.deleteReference(req.user.userId, id);
  }

  // Reference Requests CRUD
  @Get('requests/all')
  async getAllRequests(@Request() req) {
    return this.referencesService.getAllReferenceRequests(req.user.userId);
  }

  @Post('requests')
  async createRequest(@Request() req, @Body() dto: CreateReferenceRequestDto) {
    return this.referencesService.createReferenceRequest(req.user.userId, dto);
  }

  @Put('requests/:id')
  async updateRequest(@Request() req, @Param('id') id: string, @Body() dto: UpdateReferenceRequestDto) {
    return this.referencesService.updateReferenceRequest(req.user.userId, id, dto);
  }

  @Delete('requests/:id')
  async deleteRequest(@Request() req, @Param('id') id: string) {
    return this.referencesService.deleteReferenceRequest(req.user.userId, id);
  }

  // Templates & Prep Materials
  @Post(':id/prep-materials')
  async generatePrepMaterials(
    @Request() req,
    @Param('id') id: string,
    @Body('jobId') jobId?: string
  ) {
    return this.referencesService.generatePrepMaterialsTemplate(req.user.userId, id, jobId);
  }
}
