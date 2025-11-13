import { Test, TestingModule } from '@nestjs/testing';
import { CoverlettersService } from './coverletters.service';

// Mock the entire service since it creates its own Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  }),
}));

describe('CoverlettersService', () => {
  let service: CoverlettersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoverlettersService],
    }).compile();

    service = module.get<CoverlettersService>(CoverlettersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list templates', async () => {
    const result = await service.listTemplates();
    expect(result).toBeDefined();
  });

  it('should get template by slug', async () => {
    const result = await service.getTemplateBySlug('test');
    expect(result).toBeDefined();
  });
});

