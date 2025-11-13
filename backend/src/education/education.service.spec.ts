import { Test, TestingModule } from '@nestjs/testing';
import { EducationService } from './education.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { EducationLevel } from './dto/education-level.enum';

describe('EducationService', () => {
  let service: EducationService;
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
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };

    supabase = {
      getClient: jest.fn().mockReturnValue(mockChain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = module.get<EducationService>(EducationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create education', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: { id: 1 }, error: null });
    const dto: CreateEducationDto = {
      userId: '1',
      degree: 'BSc',
      institution: 'Test University',
      startDate: '2020-01-01',
      educationLevel: EducationLevel.BACHELOR,
    } as any;
    const result = await service.create(dto);
    expect(result).toBeDefined();
  });

  it('should find all by user', async () => {
    const mockClient = supabase.getClient();
    mockClient.order.mockResolvedValue({ data: [], error: null });
    const result = await service.findAllByUser('1');
    expect(result).toBeDefined();
  });

  it('should find one', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: {}, error: null });
    const result = await service.findOne(1);
    expect(result).toBeDefined();
  });

  it('should update', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: {}, error: null });
    const result = await service.update(1, {});
    expect(result).toBeDefined();
  });

  it('should delete', async () => {
    const mockClient = supabase.getClient();
    mockClient.eq.mockResolvedValue({ error: null });
    const result = await service.remove(1);
    expect(result).toBeDefined();
  });
});

