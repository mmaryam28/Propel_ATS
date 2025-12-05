import { Test, TestingModule } from '@nestjs/testing';
import { NetworkingService } from './networking.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('NetworkingService', () => {
  let service: NetworkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkingService,
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();

    service = module.get<NetworkingService>(NetworkingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
