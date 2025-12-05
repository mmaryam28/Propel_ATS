import { Test, TestingModule } from '@nestjs/testing';
import { CertificationService } from './certification.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CertificationService', () => {
  let service: CertificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

