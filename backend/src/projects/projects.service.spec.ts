import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

