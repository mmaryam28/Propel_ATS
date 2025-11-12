import { Controller, Get, Query, Param } from '@nestjs/common';
import { CoverlettersService } from './coverletters.service';

@Controller('coverletters')
export class CoverlettersController {
  constructor(private readonly svc: CoverlettersService) {}

  @Get('templates')
  listTemplates(@Query('q') q?: string, @Query('category') category?: string) {
    return this.svc.listTemplates(q, category);
  }

  @Get('templates/:slug')
  getTemplate(@Param('slug') slug: string) {
    return this.svc.getTemplateBySlug(slug);
  }
}
