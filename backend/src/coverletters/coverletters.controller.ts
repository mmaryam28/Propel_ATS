import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

import { CoverlettersService } from './coverletters.service';
import { CoverletterAIService } from './coverletters.ai.service';
import { CompanyResearchService } from './coverletters.research.service';

import PDFDocument = require('pdfkit');
import { Document, Packer, Paragraph } from 'docx';

@Controller('coverletters')
export class CoverlettersController {
  constructor(
    private readonly svc: CoverlettersService,
    private readonly ai: CoverletterAIService,
    private readonly research: CompanyResearchService,
  ) {}

  // ===============================================================
  // UC-055: Template Library
  // ===============================================================
  @Get('templates')
  listTemplates(@Query('q') q?: string, @Query('category') category?: string) {
    return this.svc.listTemplates(q, category);
  }

  @Get('templates/:slug')
  getTemplate(@Param('slug') slug: string) {
    return this.svc.getTemplateBySlug(slug);
  }

  // ===============================================================
  // UC-056: Saved Cover Letters CRUD - MUST come before ':id' route
  // ===============================================================
  
  @Post('saved')
  @UseGuards(AuthGuard('jwt'))
  async saveCoverLetter(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    return this.svc.saveCoverLetter(userId, body);
  }

  @Get('saved')
  @UseGuards(AuthGuard('jwt'))
  async listSavedCoverLetters(@Req() req: any, @Query('jobId') jobId?: string) {
    const userId = req.user.userId;
    return this.svc.listSavedCoverLetters(userId, jobId);
  }

  @Get('saved/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSavedCoverLetter(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.svc.getSavedCoverLetter(userId, id);
  }

  @Put('saved/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateCoverLetter(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const userId = req.user.userId;
    return this.svc.updateCoverLetter(userId, id, body);
  }

  @Delete('saved/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCoverLetter(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.svc.deleteCoverLetter(userId, id);
  }

  // ===============================================================
  // Get User's Cover Letters (for A/B Testing dropdown)
  // ===============================================================
  @Get()
  getUserCoverLetters(@Query('userId') userId: string) {
    return this.svc.getUserCoverLetters(userId);
  }

  // Get specific cover letter by ID
  @Get(':id')
  async getCoverLetter(@Param('id') id: string) {
    return this.svc.getCoverLetterById(id);
  }

  // Export cover letter as PDF
  @Get(':id/export/pdf')
  async exportCoverLetterPDF(@Param('id') id: string, @Res() res: Response) {
    const coverLetter = await this.svc.getCoverLetterById(id);
    
    // Extract text from content field
    let text = '';
    if (typeof coverLetter.content === 'string') {
      text = coverLetter.content;
    } else if (coverLetter.content && coverLetter.content.text) {
      text = coverLetter.content.text;
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${coverLetter.title || 'cover-letter'}.pdf"`,
      );
      res.send(pdfBuffer);
    });

    doc.fontSize(12).text(text, { align: 'left', lineGap: 5 });
    doc.end();
  }

  // ===============================================================
  // UC-056 + UC-057: AI Cover Letter Generation + Company Research
  // ===============================================================
  @Post('generate')
  async generateAI(@Body() body: any) {
    const template = await this.svc.getTemplateBySlug(body.templateSlug);

    if (!template || !template.latest) {
      throw new Error('Template or template.latest is null');
    }

    const companyInfo = await this.research.getCompanyInsights(
      body.company || '',
    );

    // keep industry simple to avoid type errors
    const industry = body.industry || 'General';

    const result = await this.ai.generateCoverLetter({
      templateBody: template.latest.body,
      jobDescription: body.jobDescription,
      profileSummary: body.profileSummary,
      tone: body.tone || 'formal',
      companyInfo,
      // if your AI service supports industry, you can add it there
      // industry,
    });

    return { generated: result };
  }

  // ===============================================================
  // UC-060: Save Edited Cover Letter (Demo-safe)
  // ===============================================================
  @Post('save')
  async saveEdits(@Body() body: any) {
    const { userId, title, content, company } = body;

    if (!userId || !title || !content) {
      return { success: false, error: 'Missing required fields: userId, title, content' };
    }

    try {
      const saved = await this.svc.saveCoverLetterVersion(userId, title, content, company);
      console.log(`Saved cover letter: ${title} for user ${userId}`);
      return { success: true, data: saved };
    } catch (error) {
      console.error('Error saving cover letter:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================================
  // UC-061: Export Cover Letter (PDF / DOCX / TXT) via one endpoint
  // ===============================================================
  @Post('export')
  async exportCoverLetter(@Body() body: any, @Res() res: Response) {
    const { text, format } = body;

    if (!text || !format) {
      return res
        .status(400)
        .json({ error: 'Missing text or format for export' });
    }

    // ---------- PDF ----------
    if (format === 'pdf') {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="cover-letter.pdf"',
        );
        res.send(pdfBuffer);
      });

      doc.fontSize(12).text(text, { align: 'left' });
      doc.end();
      return;
    }

    // ---------- DOCX ----------
    if (format === 'docx') {
      const doc = new Document({
        sections: [
          {
            children: text
              .split('\n')
              .map((line: string) => new Paragraph({ text: line })),
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="cover-letter.docx"',
      );
      res.end(buffer);
      return;
    }

    // ---------- TXT ----------
    if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="cover-letter.txt"',
      );
      res.send(text);
      return;
    }

    // ---------- Unsupported ----------
    return res.status(400).json({ error: 'Unsupported export format' });
  }
}
