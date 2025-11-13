import { Test, TestingModule } from '@nestjs/testing';
import { CertificationService } from './certification.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CertificationService', () => {
  let service: CertificationService;
  let supabase: any;

  beforeEach(async () => {
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };

    supabase = {
      getClient: jest.fn().mockReturnValue(mockChain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create certification', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: { id: 1 }, error: null });
    const result = await service.create({} as any);
    expect(result).toBeDefined();
  });

  it('should find all certifications for user', async () => {
    const mockClient = supabase.getClient();
    mockClient.order.mockResolvedValue({ data: [], error: null });
    const result = await service.findAllByUser('1');
    expect(result).toBeDefined();
  });

  it('should search organizations', async () => {
    const mockClient = supabase.getClient();
    mockClient.ilike.mockResolvedValue({ data: ['Org1', 'Org2'], error: null });
    const result = await service.searchOrganizations('Org');
    expect(result).toBeDefined();
  });

  it('should find one certification', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: {}, error: null });
    const result = await service.findOne(1);
    expect(result).toBeDefined();
  });

  it('should update certification', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: {}, error: null });
    const result = await service.update(1, {});
    expect(result).toBeDefined();
  });

  it('should delete certification', async () => {
    const mockClient = supabase.getClient();
    mockClient.eq.mockResolvedValue({ error: null });
    const result = await service.remove(1);
    expect(result).toBeDefined();
  });
});

