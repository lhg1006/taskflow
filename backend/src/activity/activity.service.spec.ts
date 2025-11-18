import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService, ActivityType } from './activity.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
  };

  const mockActivity = {
    id: 'activity-1',
    cardId: 'card-1',
    userId: 'user-1',
    actionType: ActivityType.CREATE_CARD,
    details: {},
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: PrismaService,
          useValue: {
            activityLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should successfully log an activity with details', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const actionType = ActivityType.UPDATE_CARD;
      const details = { field: 'title', oldValue: 'Old', newValue: 'New' };

      jest.spyOn(prismaService.activityLog, 'create').mockResolvedValue({
        ...mockActivity,
        actionType,
        details,
      });

      const result = await service.logActivity(cardId, userId, actionType, details);

      expect(prismaService.activityLog.create).toHaveBeenCalledWith({
        data: {
          cardId,
          userId,
          actionType,
          details,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
      expect(result.actionType).toBe(actionType);
      expect(result.details).toEqual(details);
    });

    it('should log activity without details (empty object)', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const actionType = ActivityType.CREATE_CARD;

      jest.spyOn(prismaService.activityLog, 'create').mockResolvedValue(mockActivity);

      const result = await service.logActivity(cardId, userId, actionType);

      expect(prismaService.activityLog.create).toHaveBeenCalledWith({
        data: {
          cardId,
          userId,
          actionType,
          details: {},
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
      expect(result.details).toEqual({});
    });

    it('should include user information in the result', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const actionType = ActivityType.ADD_COMMENT;

      jest.spyOn(prismaService.activityLog, 'create').mockResolvedValue(mockActivity);

      const result = await service.logActivity(cardId, userId, actionType);

      expect(result.user).toEqual(mockUser);
    });
  });

  describe('getCardActivities', () => {
    it('should return all activities for a card in descending order', async () => {
      const cardId = 'card-1';
      const mockActivities = [
        {
          ...mockActivity,
          id: 'activity-3',
          actionType: ActivityType.UPDATE_CARD,
          createdAt: new Date('2024-01-03'),
        },
        {
          ...mockActivity,
          id: 'activity-2',
          actionType: ActivityType.ADD_COMMENT,
          createdAt: new Date('2024-01-02'),
        },
        {
          ...mockActivity,
          id: 'activity-1',
          actionType: ActivityType.CREATE_CARD,
          createdAt: new Date('2024-01-01'),
        },
      ];

      jest.spyOn(prismaService.activityLog, 'findMany').mockResolvedValue(mockActivities);

      const result = await service.getCardActivities(cardId);

      expect(prismaService.activityLog.findMany).toHaveBeenCalledWith({
        where: { cardId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockActivities);
    });

    it('should return empty array if card has no activities', async () => {
      const cardId = 'card-with-no-activities';
      jest.spyOn(prismaService.activityLog, 'findMany').mockResolvedValue([]);

      const result = await service.getCardActivities(cardId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should include user information for each activity', async () => {
      const cardId = 'card-1';
      const mockActivities = [
        {
          ...mockActivity,
          user: mockUser,
        },
      ];

      jest.spyOn(prismaService.activityLog, 'findMany').mockResolvedValue(mockActivities);

      const result = await service.getCardActivities(cardId);

      expect(result[0].user).toBeDefined();
      expect(result[0].user).toEqual(mockUser);
    });
  });
});
