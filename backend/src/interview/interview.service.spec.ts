import { Test, TestingModule } from '@nestjs/testing';
import { InterviewService } from './interview.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('InterviewService', () => {
  let service: InterviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
