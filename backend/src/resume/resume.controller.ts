import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  create(@Body() dto: CreateResumeDto) {
    return this.resumeService.create(dto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.resumeService.findAll(userId);
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

  @Post('validate')
  validateResume(@Body() dto: GenerateAIDto) {
    return this.resumeService.validateResume(dto);
  }


}
