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
});
