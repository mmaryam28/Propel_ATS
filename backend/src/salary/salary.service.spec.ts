import { Test, TestingModule } from '@nestjs/testing';
import { SalaryService } from './salary.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('SalaryService', () => {
  let service: SalaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SalaryService>(SalaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
