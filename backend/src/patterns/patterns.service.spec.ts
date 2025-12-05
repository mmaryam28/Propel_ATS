import { Test, TestingModule } from '@nestjs/testing';
import { PatternsService } from './patterns.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('PatternsService', () => {
  let service: PatternsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatternsService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<PatternsService>(PatternsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
