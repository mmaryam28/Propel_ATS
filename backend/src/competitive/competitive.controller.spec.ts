import { Test, TestingModule } from '@nestjs/testing';
import { CompetitiveController } from './competitive.controller';
import { CompetitiveService } from './competitive.service';

describe('CompetitiveController', () => {
  let controller: CompetitiveController;
  let service: CompetitiveService;

  const mockCompetitiveService = {
    getBenchmarks: jest.fn(),
    getSkillPositioning: jest.fn(),
    getCareerPatterns: jest.fn(),
    getRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetitiveController],
      providers: [
        {
          provide: CompetitiveService,
          useValue: mockCompetitiveService,
        },
      ],
    }).compile();

    controller = module.get<CompetitiveController>(CompetitiveController);
    service = module.get<CompetitiveService>(CompetitiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBenchmarks', () => {
    it('should return peer benchmarks', async () => {
      const mockBenchmarks = {
        applicationsPerMonth: { user: 20, peer: 25, industry: 25 },
        responseRate: { user: 15, peer: 18, industry: 18 },
        interviewRate: { user: 10, peer: 12, industry: 12 },
        offerRate: { user: 3, peer: 5, industry: 5 },
      };

      mockCompetitiveService.getBenchmarks.mockResolvedValue(mockBenchmarks);

      const req = { user: { userId: 'test-user-id' } };
      const result = await controller.getBenchmarks(req);

      expect(result).toEqual(mockBenchmarks);
      expect(mockCompetitiveService.getBenchmarks).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('getSkillPositioning', () => {
    it('should return skill positioning data', async () => {
      const mockPositioning = {
        overallRating: 'At Market',
        userSkills: [],
        peerAverage: 2.5,
        topPerformerAverage: 3.2,
        skillGaps: ['SQL', 'AWS'],
      };

      mockCompetitiveService.getSkillPositioning.mockResolvedValue(mockPositioning);

      const req = { user: { userId: 'test-user-id' } };
      const result = await controller.getSkillPositioning(req);

      expect(result).toEqual(mockPositioning);
      expect(mockCompetitiveService.getSkillPositioning).toHaveBeenCalledWith('test-user-id');
    });
  });
});
