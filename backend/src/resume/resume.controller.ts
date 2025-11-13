/*import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  // ============================================
  // STATIC ROUTES (must come before dynamic ones)
  // ============================================

  @Post()
  create(@Body() dto: CreateResumeDto) {
    return this.resumeService.create(dto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.resumeService.findAll(userId);
  }

  // --- Validation ---
  @Post('validate')
  validateResume(@Body('userProfile') profile: any) {
    return this.resumeService.validateResume(profile);
  }

  // --- AI Resume Generator ---
  @Post('generate-ai')
  generateAI(@Body() dto: GenerateAIDto) {
    return this.resumeService.generateAI(dto);
  }

  @Post('optimize-skills')
  optimizeSkills(@Body() dto: GenerateAIDto) {
    return this.resumeService.optimizeSkills(dto);
  }

  @Post('tailor-experience')
  tailorExperience(@Body() dto: GenerateAIDto) {
    return this.resumeService.tailorExperience(dto);
  }

  // --- Resume Template Management ---
  @Get('templates')
  getTemplates() {
    return this.resumeService.getTemplates();
  }

  // --- SINGLE Upload Route (fixed) ---
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('resumeFile', {
      storage: diskStorage({
        destination: './uploads/resumes',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  uploadResume(@UploadedFile() file: any, @Body('userId') userId: string) {
    return this.resumeService.uploadResume(file, userId);
  }

  // =====================================================
  // DYNAMIC ROUTES (must come last so they don't override)
  // =====================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resumeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateResumeDto) {
    return this.resumeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resumeService.remove(id);
  }
}
*/