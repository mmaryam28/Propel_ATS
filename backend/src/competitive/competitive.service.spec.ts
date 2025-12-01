import { Test, TestingModule } from '@nestjs/testing';
import { CompetitiveService } from './competitive.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CompetitiveService', () => {
  let service: CompetitiveService;
  let supabaseService: SupabaseService;

  const mockSupabaseService = {
    getClient: jest.fn(() => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          is: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitiveService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<CompetitiveService>(CompetitiveService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBenchmarks', () => {
    it('should return benchmark comparison data', async () => {
      const result = await service.getBenchmarks('test-user-id');
      
      expect(result).toHaveProperty('applicationsPerMonth');
      expect(result).toHaveProperty('responseRate');
      expect(result).toHaveProperty('interviewRate');
      expect(result).toHaveProperty('offerRate');
      
      expect(result.applicationsPerMonth).toHaveProperty('user');
      expect(result.applicationsPerMonth).toHaveProperty('peer');
      expect(result.applicationsPerMonth).toHaveProperty('industry');
    });
  });

  describe('getSkillPositioning', () => {
    it('should return skill positioning analysis', async () => {
      const result = await service.getSkillPositioning('test-user-id');
      
      expect(result).toHaveProperty('overallRating');
      expect(result).toHaveProperty('userSkills');
      expect(result).toHaveProperty('peerAverage');
      expect(result).toHaveProperty('topPerformerAverage');
      expect(result).toHaveProperty('skillGaps');
    });
  });
});
