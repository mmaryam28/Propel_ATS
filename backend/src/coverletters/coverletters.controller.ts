import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { CoverlettersService } from './coverletters.service';
import { CoverletterAIService } from './coverletters.ai.service';
import { CompanyResearchService } from './coverletters.research.service';

@Controller('coverletters')
export class CoverlettersController {
  constructor(
    private readonly svc: CoverlettersService,
    private readonly ai: CoverletterAIService,
    private readonly research: CompanyResearchService,
  ) {}

  // === UC-055: Template Library Endpoints ===
  @Get('templates')
  listTemplates(@Query('q') q?: string, @Query('category') category?: string) {
    return this.svc.listTemplates(q, category);
  }

  @Get('templates/:slug')
  getTemplate(@Param('slug') slug: string) {
    return this.svc.getTemplateBySlug(slug);
  }

  // === UC-056: AI Cover Letter Generation ===
  @Post('generate')
  async generateAI(@Body() body: any) {
    const template = await this.svc.getTemplateBySlug(body.templateSlug);

    if (!template || !template.latest) {
      throw new Error('Template or template.latest is null');
    }

    const companyInfo = await this.research.getCompanyInsights(body.company || '');


    const result = await this.ai.generateCoverLetter({
      templateBody: template.latest.body,
      jobDescription: body.jobDescription,
      profileSummary: body.profileSummary,
      tone: body.tone || 'formal',
      companyInfo,
    });

    return { generated: result };
  }
}
