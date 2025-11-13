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
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import type { Response } from 'express';
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

  // Health check for Ollama connection
  @Get('ollama-status')
  async checkOllamaStatus() {
    return this.resumeService.checkOllamaConnection();
  }

  // --- AI Resume Generator ---
  @Post('generate-ai')
  async generateAI(@Body() dto: any, @Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    console.log('\n📥 [Controller] Received generate-ai request');
    console.log(`⚙️  Format requested: ${format || 'json (default)'}`);
    
    const startTime = Date.now();
    
    // Check if user is sending edited content override
    const aiContentOverride = dto.aiContentOverride;
    let result;
    
    if (aiContentOverride) {
      console.log('✏️  Using edited AI content override from client');
      result = { aiContent: aiContentOverride };
    } else {
      result = await this.resumeService.generateAI(dto);
    }
    
    const elapsed = Date.now() - startTime;
    
    console.log(`📤 [Controller] AI processing time: ${(elapsed / 1000).toFixed(2)}s`);
    console.log(`📊 AI Response structure:`, {
      hasAiContent: !!result.aiContent,
      isRaw: !!result.aiContent?.raw,
      hasValidJSON: !result.aiContent?.raw && typeof result.aiContent === 'object'
    });
    
    if (format === 'pdf' && res) {
      console.log('📄 [Controller] Generating PDF...');
      const pdfStart = Date.now();
      
      // Get user's full name and contact info from database if userId is provided
      let userName = dto.userProfile?.name || 'Professional';
      let userEmail = dto.userProfile?.email || '';
      let userPhone = dto.userProfile?.phone || '';
      
      if (dto.userProfile?.userId) {
        try {
          console.log(`🔍 Fetching user with ID: ${dto.userProfile.userId}`);
          const user = await this.resumeService.getUserById(dto.userProfile.userId);
          userName = `${user.firstname} ${user.lastname}`;
          userEmail = user.email || userEmail;
          userPhone = user.phone || userPhone;
          console.log(`👤 Fetched user: ${userName}, Email: ${userEmail}`);
        } catch (err) {
          console.warn('⚠️  Could not fetch user:', err.message);
          console.warn('⚠️  Using default name and contact info from userProfile');
        }
      } else {
        console.warn('⚠️  No userId provided in userProfile');
      }
      
      // Extract the actual resume data from the AI response
      // Handle case where AI returns { raw: "..." } due to incomplete JSON
      let aiData = result.aiContent;
      if (aiData?.raw && typeof aiData.raw === 'string') {
        console.warn('⚠️  AI returned raw text, attempting to parse...');
        try {
          // Try to parse the raw string as JSON
          aiData = JSON.parse(aiData.raw);
        } catch (e) {
          console.error('❌ Failed to parse raw AI response');
          aiData = { sections: {}, skills: {} };
        }
      }
      
      const resumeDataForPDF = {
        name: userName,
        contact: {
          email: userEmail,
          phone: userPhone,
          location: dto.userProfile?.location || '',
          linkedin: dto.userProfile?.linkedin || '',
        },
        sections: aiData?.sections || {},
        skills: aiData?.skills || {},
        experience: aiData?.sections?.experience || aiData?.experience || [],
      };
      
      console.log('📋 PDF Data structure:', {
        name: resumeDataForPDF.name,
        contactEmail: resumeDataForPDF.contact.email,
        contactPhone: resumeDataForPDF.contact.phone,
        hasSections: !!resumeDataForPDF.sections,
        hasSkills: !!resumeDataForPDF.skills,
        experienceCount: Array.isArray(resumeDataForPDF.experience) ? resumeDataForPDF.experience.length : 0,
      });
      
      const pdfBuffer = await this.resumeService.generatePDF(resumeDataForPDF);
      const pdfElapsed = Date.now() - pdfStart;
      console.log(`✅ [Controller] PDF generated in ${pdfElapsed}ms`);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
      return;
    }
    
    console.log('📋 [Controller] Returning JSON response');
    return result;
  }

  @Post('optimize-skills')
  async optimizeSkills(@Body() dto: GenerateAIDto, @Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    const result = await this.resumeService.optimizeSkills(dto);
    
    if (format === 'pdf' && res) {
      const resumeDataForPDF = {
        name: dto.userProfile?.name || 'Professional',
        contact: dto.userProfile?.contact || {},
        sections: {},
        skills: result.optimization || {},
        experience: dto.userProfile?.experience || [],
      };
      
      const pdfBuffer = await this.resumeService.generatePDF(resumeDataForPDF);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="optimized-resume-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
      return;
    }
    
    return result;
  }

  @Post('tailor-experience')
  async tailorExperience(@Body() dto: GenerateAIDto, @Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    const result = await this.resumeService.tailorExperience(dto);
    
    if (format === 'pdf' && res) {
      const resumeDataForPDF = {
        name: dto.userProfile?.name || 'Professional',
        contact: dto.userProfile?.contact || {},
        sections: {},
        skills: dto.userProfile?.skills || {},
        experience: result.tailored || [],
      };
      
      const pdfBuffer = await this.resumeService.generatePDF(resumeDataForPDF);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tailored-resume-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
      return;
    }
    
    return result;
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

  // Dynamic route for PDF export
  @Get(':id/export/pdf')
  async exportPDF(@Param('id') id: string, @Res() res: Response) {
    const resume = await this.resumeService.findOne(id);
    const pdfBuffer = await this.resumeService.generatePDF(resume);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resume-${resume.title || id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
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
*/