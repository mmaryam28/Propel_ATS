import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { SupabaseService } from '../supabase/supabase.service';

describe('ProfileController', () => {
  let controller: ProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: SupabaseService, useValue: { getClient: jest.fn() } },
      ],
    }).compile();
    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
