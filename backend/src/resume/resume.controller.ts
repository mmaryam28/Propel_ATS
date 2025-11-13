import {
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
import type { Express } from 'express';
import { ResumeService } from './resume.service';
import { extname } from 'path';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  create(@Body() createResumeDto: CreateResumeDto) {
    return this.resumeService.create(createResumeDto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.resumeService.findAll(userId);
  }

  // STATIC ROUTES MUST COME FIRST

  @Post('validate')
  validateResume(@Body('userProfile') profile: any) {
    return this.resumeService.validateResume(profile);
  }

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
  upload(@UploadedFile() file: Express.Multer.File, @Body('userId') userId: string) {
    return this.resumeService.uploadResume(file, userId);
  }

  
  // Resume Template Management (UC-046)
  @Get('templates')
  getTemplates() {
    // Simple default data for now (you can later pull from Supabase)
    return {
      templates: [
        {
          id: 'chronological',
          name: 'Chronological',
          type: 'chronological',
          preview: null,
        },
        {
          id: 'functional',
          name: 'Functional',
          type: 'functional',
          preview: null,
        },
        {
          id: 'hybrid',
          name: 'Hybrid',
          type: 'hybrid',
          preview: null,
        },
      ],
    };
  }

  // AI Resume Generation
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



  @Post('upload')
  @UseInterceptors(
    FileInterceptor('resumeFile', {
      storage: diskStorage({
        destination: './uploads/resumes',
        filename: (req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    return this.resumeService.uploadResume(file, userId);
  }

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
