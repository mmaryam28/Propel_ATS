import { Test, TestingModule } from '@nestjs/testing';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { InterviewPrepService } from './interview-prep.service';

describe('InterviewController', () => {
  let controller: InterviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewController],
      providers: [
        { provide: InterviewService, useValue: {} },
        { provide: InterviewPrepService, useValue: {} },
      ],
    }).compile();

    controller = module.get<InterviewController>(InterviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
