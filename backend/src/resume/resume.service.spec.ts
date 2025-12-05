import { Test, TestingModule } from '@nestjs/testing';
import { ResumeService } from './resume.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('ResumeService', () => {
  let service: ResumeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        { provide: PrismaService, useValue: {} },
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
