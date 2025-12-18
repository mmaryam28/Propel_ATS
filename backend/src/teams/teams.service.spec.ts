import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      auth: {
        getUser: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: 'MailService',
          useValue: { sendEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
