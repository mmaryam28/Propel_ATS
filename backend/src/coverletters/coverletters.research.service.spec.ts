import { Test, TestingModule } from '@nestjs/testing';
import { CompanyResearchService } from './coverletters.research.service';

describe('CompanyResearchService', () => {
  let service: CompanyResearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyResearchService],
    }).compile();

    service = module.get<CompanyResearchService>(CompanyResearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanyInsights', () => {
    it('should return a string or undefined', async () => {
      const companyName = 'Tech Corp';

      const result = await service.getCompanyInsights(companyName);

      expect(result === undefined || typeof result === 'string').toBe(true);
    });
  });
});
