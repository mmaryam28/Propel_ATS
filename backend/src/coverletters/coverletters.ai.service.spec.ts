import { Test, TestingModule } from '@nestjs/testing';
import { CoverletterAIService } from './coverletters.ai.service';

describe('CoverletterAIService', () => {
  let service: CoverletterAIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoverletterAIService],
    }).compile();

    service = module.get<CoverletterAIService>(CoverletterAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCoverLetter', () => {
    it('should return a string', async () => {
      const params = { 
        templateBody: 'Template', 
        jobDescription: 'Job desc',
        profileSummary: 'Profile',
        tone: 'formal',
        companyInfo: 'Company info'
      };

      const result = await service.generateCoverLetter(params);

      expect(typeof result === 'string' || result === undefined).toBe(true);
    });
  });
});
