import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('MatchService', () => {
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
