import { Test, TestingModule } from '@nestjs/testing';
import { CoverlettersController } from './coverletters.controller';
import { CoverlettersService } from './coverletters.service';
import { CoverletterAIService } from './coverletters.ai.service';
import { CompanyResearchService } from './coverletters.research.service';

describe('CoverlettersController', () => {
  let controller: CoverlettersController;
  let service: any;
  let aiService: any;
  let researchService: any;

  beforeEach(async () => {
    service = {
      listTemplates: jest.fn().mockResolvedValue([]),
      getTemplateBySlug: jest.fn().mockResolvedValue({ latest: { body: 'template' } }),
    };

    aiService = {
      generateCoverLetter: jest.fn().mockResolvedValue('Generated content'),
      improveCoverLetter: jest.fn().mockResolvedValue('Improved content'),
    };

    researchService = {
      getCompanyInsights: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoverlettersController],
      providers: [
        { provide: CoverlettersService, useValue: service },
        { provide: CoverletterAIService, useValue: aiService },
        { provide: CompanyResearchService, useValue: researchService },
      ],
    }).compile();

    controller = module.get<CoverlettersController>(CoverlettersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listTemplates', () => {
    it('should return templates', async () => {
      const templates = [{ id: 1, name: 'Template' }];
      service.listTemplates.mockResolvedValue(templates);

      const result = await controller.listTemplates();

      expect(result).toBeDefined();
    });
  });

  describe('getTemplate', () => {
    it('should return a template', async () => {
      const template = { id: 1, name: 'Template', latest: { body: 'content' } };
      service.getTemplateBySlug.mockResolvedValue(template);

      const result = await controller.getTemplate('test-slug');

      expect(result).toBeDefined();
    });
  });

  describe('generateAI', () => {
    it('should generate a cover letter', async () => {
      const body: any = {
        templateSlug: 'test',
        jobDescription: 'Job description',
        profileSummary: 'Profile',
      };
      service.getTemplateBySlug.mockResolvedValue({ latest: { body: 'template' } });
      researchService.getCompanyInsights.mockResolvedValue({});
      aiService.generateCoverLetter.mockResolvedValue('Generated content');

      const result = await controller.generateAI(body);

      expect(result).toBeDefined();
    });
  });
});

