import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { SupabaseService } from '../supabase/supabase.service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('JobsService', () => {
  let service: JobsService;
  let supabase: any;

  beforeEach(async () => {
    // Create a comprehensive mock for Supabase client chain
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };

    supabase = {
      getClient: jest.fn().mockReturnValue(mockChain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return jobs list', async () => {
      const userId = '1';
      const mockClient = supabase.getClient();
      mockClient.eq.mockReturnThis();
      mockClient.is.mockReturnThis();
      mockClient.order.mockResolvedValue({ data: [], error: null });

      const result = await service.list(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new job', async () => {
      const userId = '1';
      const createDto: any = {
        title: 'Software Engineer',
        company: 'Tech Corp',
      };
      const mockClient = supabase.getClient();
      mockClient.single.mockResolvedValue({ 
        data: { id: 'mock-uuid-1234', ...createDto }, 
        error: null 
      });

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      const userId = '1';
      const jobId = '1';
      const updateDto: any = { title: 'Senior Engineer' };
      const mockClient = supabase.getClient();
      mockClient.single.mockResolvedValue({ 
        data: { id: jobId, ...updateDto }, 
        error: null 
      });

      const result = await service.update(userId, jobId, updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a job', async () => {
      const userId = '1';
      const jobId = '1';
      const mockClient = supabase.getClient();
      // delete().eq().eq() chain - need to return this twice
      mockClient.eq.mockReturnThis();
      mockClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await service.delete(userId, jobId);

      expect(result).toBeDefined();
    });
  });
});
