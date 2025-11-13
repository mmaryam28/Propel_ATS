import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let supabase: any;

  beforeEach(async () => {
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };

    supabase = {
      getClient: jest.fn().mockReturnValue(mockChain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all applications', async () => {
    const mockClient = supabase.getClient();
    mockClient.eq.mockResolvedValue({ data: [], error: null });
    const result = await service.findAll('1');
    expect(result).toBeDefined();
  });

  it('should create application', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: { id: 1 }, error: null });
    const result = await service.create('1', { foo: 'bar' });
    expect(result).toBeDefined();
  });

  it('should update application', async () => {
    const mockClient = supabase.getClient();
    mockClient.eq.mockResolvedValue({ data: { id: 1 }, error: null });
    const result = await service.update('1', '2', { foo: 'bar' });
    expect(result).toBeDefined();
  });

  it('should remove application', async () => {
    const mockClient = supabase.getClient();
    mockClient.eq.mockResolvedValue({ error: null });
    const result = await service.remove('1', '2');
    expect(result).toBeDefined();
  });
});
