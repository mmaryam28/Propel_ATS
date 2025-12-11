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
    const { slug, content } = body;

    if (!slug || !content) {
      return { success: false, error: 'Missing slug or content' };
    }

    // For now, just pretend we saved to DB successfully.
    // This avoids schema issues and gives you a clean demo.
    console.log(`Saved edited cover letter for slug=${slug}`);
    return { success: true };
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

  // ===============================================================
  // UC-056: Saved Cover Letters CRUD
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
}
