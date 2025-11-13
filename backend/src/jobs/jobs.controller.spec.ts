import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

// Mock uuid before importing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('JobsController', () => {
  let controller: JobsController;
  let service: any;

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      updateStatus: jest.fn().mockResolvedValue({}),
      getHistory: jest.fn().mockResolvedValue([]),
      getMaterialsHistory: jest.fn().mockResolvedValue([]),
      getCompanyNews: jest.fn().mockResolvedValue([]),
      archive: jest.fn().mockResolvedValue({}),
      restore: jest.fn().mockResolvedValue({}),
      bulkUpdateStatus: jest.fn().mockResolvedValue({}),
      bulkArchive: jest.fn().mockResolvedValue({}),
      importFromUrl: jest.fn().mockResolvedValue({}),
      enrichCompanyFromUrl: jest.fn().mockResolvedValue({}),
      scheduleInterview: jest.fn().mockResolvedValue({}),
      getInterviews: jest.fn().mockResolvedValue([]),
      updateInterview: jest.fn().mockResolvedValue({}),
      deleteInterview: jest.fn().mockResolvedValue({}),
      getAnalytics: jest.fn().mockResolvedValue({}),
      createAutomationRule: jest.fn().mockResolvedValue({}),
      getAutomationRules: jest.fn().mockResolvedValue([]),
      updateAutomationRule: jest.fn().mockResolvedValue({}),
      deleteAutomationRule: jest.fn().mockResolvedValue({}),
      getMaterialsUsage: jest.fn().mockResolvedValue({}),
      getUserMaterialDefaults: jest.fn().mockResolvedValue({}),
      setUserMaterialDefaults: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: service }],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return all jobs', async () => {
      const req = { user: { userId: '1' } };
      const jobs = [{ id: '1', title: 'Developer' }];
      service.list.mockResolvedValue(jobs);

      const result = await controller.list(req);

      expect(result).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should return a single job', async () => {
      const req = { user: { userId: '1' } };
      const job = { id: '1', title: 'Developer' };
      service.getById.mockResolvedValue(job);

      const result = await controller.getOne(req, '1');

      expect(result).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a job', async () => {
      const req = { user: { userId: '1' } };
      const createDto: any = { title: 'Engineer', company: 'Tech' };
      const created = { id: '1', ...createDto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(req, createDto);

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      const req = { user: { userId: '1' } };
      const updateDto: any = { title: 'Senior Engineer' };
      const updated = { id: '1', ...updateDto };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(req, '1', updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a job', async () => {
      const req = { user: { userId: '1' } };
      service.delete.mockResolvedValue({ success: true });

      const result = await controller.delete(req, '1');

      expect(result).toBeDefined();
    });
  });

  describe('scheduleInterview', () => {
    it('should schedule an interview', async () => {
      const req = { user: { userId: '1' } };
      const scheduleDto: any = { date: '2024-12-01', time: '10:00' };
      const scheduled = { id: '1', ...scheduleDto };
      service.scheduleInterview.mockResolvedValue(scheduled);

      const result = await controller.scheduleInterview(req, scheduleDto);

      expect(result).toBeDefined();
    });
  });
});
