import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
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
        ProjectsService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create project', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: { id: 1 }, error: null });
    const projectData = {
      userId: '1',
      title: 'Test Project',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };
    const result = await service.create(projectData as any);
    expect(result).toBeDefined();
  });

  it('should find all projects for user', async () => {
    const mockClient = supabase.getClient();
    mockClient.order.mockResolvedValue({ data: [], error: null });
    const result = await service.findAllByUser('1');
    expect(result).toBeDefined();
  });

  it('should add media to project', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: { id: 99 }, error: null });
    const result = await service.addMedia(1, 'http://img', 'IMAGE', 'test');
    expect(result).toBeDefined();
  });

  it('should find one project', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: {}, error: null });
    const result = await service.findOne(1);
    expect(result).toBeDefined();
  });

  it('should update project', async () => {
    const mockClient = supabase.getClient();
    mockClient.single.mockResolvedValue({ data: {}, error: null });
    const result = await service.update(1, {});
    expect(result).toBeDefined();
  });

  it('should delete project', async () => {
    const mockClient = supabase.getClient();
    mockClient.select.mockReturnThis();
    mockClient.single.mockResolvedValue({ error: null });
    const result = await service.remove(1);
    expect(result).toBeDefined();
  });
});

