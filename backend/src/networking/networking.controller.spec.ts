import { Test, TestingModule } from '@nestjs/testing';
import { NetworkingController } from './networking.controller';
import { NetworkingService } from './networking.service';

describe('NetworkingController', () => {
  let controller: NetworkingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetworkingController],
      providers: [
        { provide: NetworkingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<NetworkingController>(NetworkingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
