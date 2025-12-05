import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('GoalsService', () => {
  let service: GoalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
