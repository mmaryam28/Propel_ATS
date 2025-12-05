import { Test, TestingModule } from '@nestjs/testing';
import { PatternsController } from './patterns.controller';
import { PatternsService } from './patterns.service';

describe('PatternsController', () => {
  let controller: PatternsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatternsController],
      providers: [
        { provide: PatternsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PatternsController>(PatternsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
