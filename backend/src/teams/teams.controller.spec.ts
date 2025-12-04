import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  const mockTeamsService = {
    createTeam: jest.fn(),
    getTeams: jest.fn(),
    getTeamById: jest.fn(),
    updateTeam: jest.fn(),
    deleteTeam: jest.fn(),
    getTeamMembers: jest.fn(),
    updateMember: jest.fn(),
    removeMember: jest.fn(),
    inviteMember: jest.fn(),
    getTeamInvitations: jest.fn(),
    getMyInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    getTeamAnalytics: jest.fn(),
    getTeamActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTeam', () => {
    it('should create a new team', async () => {
      const req = { user: { userId: 'user-123' } };
      const createTeamDto = { name: 'Test Team', description: 'A test team' };
      const expectedResult = { id: 'team-123', ...createTeamDto };

      mockTeamsService.createTeam.mockResolvedValue(expectedResult);

      const result = await controller.createTeam(req, createTeamDto);

      expect(result).toEqual(expectedResult);
      expect(mockTeamsService.createTeam).toHaveBeenCalledWith(
        'user-123',
        createTeamDto,
      );
    });
  });

  describe('getTeams', () => {
    it('should return all teams for the user', async () => {
      const req = { user: { userId: 'user-123' } };
      const expectedResult = [
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ];

      mockTeamsService.getTeams.mockResolvedValue(expectedResult);

      const result = await controller.getTeams(req);

      expect(result).toEqual(expectedResult);
      expect(mockTeamsService.getTeams).toHaveBeenCalledWith('user-123');
    });
  });
});
