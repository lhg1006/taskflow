import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService, NotificationType } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: PrismaService;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.ASSIGNED,
    message: 'You have been assigned to a card',
    cardId: 'card-1',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspaceInvitationId: null,
    card: {
      id: 'card-1',
      title: 'Test Card',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification with cardId', async () => {
      const userId = 'user-1';
      const type = NotificationType.ASSIGNED;
      const message = 'You have been assigned to a card';
      const cardId = 'card-1';

      jest.spyOn(prismaService.notification, 'create').mockResolvedValue(mockNotification);

      const result = await service.createNotification(userId, type, message, cardId);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          type,
          message,
          cardId,
        },
        include: {
          card: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should create a notification without cardId', async () => {
      const userId = 'user-1';
      const type = NotificationType.WORKSPACE_INVITATION;
      const message = 'You have been invited to a workspace';

      const notifWithoutCard = { ...mockNotification, cardId: undefined, card: null };
      jest.spyOn(prismaService.notification, 'create').mockResolvedValue(notifWithoutCard);

      const result = await service.createNotification(userId, type, message);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          type,
          message,
          cardId: undefined,
        },
        include: {
          card: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      expect(result.cardId).toBeUndefined();
    });
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      const userId = 'user-1';
      const mockNotifications = [mockNotification];

      jest.spyOn(prismaService.notification, 'findMany').mockResolvedValue(mockNotifications);

      const result = await service.getUserNotifications(userId);

      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return only unread notifications when unreadOnly is true', async () => {
      const userId = 'user-1';
      const unreadNotifications = [mockNotification];

      jest.spyOn(prismaService.notification, 'findMany').mockResolvedValue(unreadNotifications);

      const result = await service.getUserNotifications(userId, true);

      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          read: false,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(unreadNotifications);
    });

    it('should limit results to 50 notifications', async () => {
      const userId = 'user-1';
      jest.spyOn(prismaService.notification, 'findMany').mockResolvedValue([]);

      await service.getUserNotifications(userId);

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      const userId = 'user-1';
      const unreadCount = 5;

      jest.spyOn(prismaService.notification, 'count').mockResolvedValue(unreadCount);

      const result = await service.getUnreadCount(userId);

      expect(prismaService.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          read: false,
        },
      });
      expect(result).toBe(unreadCount);
    });

    it('should return 0 when there are no unread notifications', async () => {
      const userId = 'user-1';
      jest.spyOn(prismaService.notification, 'count').mockResolvedValue(0);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const id = 'notif-1';
      const userId = 'user-1';
      const readNotification = { ...mockNotification, read: true };

      jest.spyOn(prismaService.notification, 'update').mockResolvedValue(readNotification);

      const result = await service.markAsRead(id, userId);

      expect(prismaService.notification.update).toHaveBeenCalledWith({
        where: { id, userId },
        data: { read: true },
      });
      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const userId = 'user-1';
      const updateResult = { count: 5 };

      jest.spyOn(prismaService.notification, 'updateMany').mockResolvedValue(updateResult);

      const result = await service.markAllAsRead(userId);

      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          read: false,
        },
        data: { read: true },
      });
      expect(result.count).toBe(5);
    });

    it('should return 0 count when no unread notifications exist', async () => {
      const userId = 'user-1';
      jest.spyOn(prismaService.notification, 'updateMany').mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead(userId);

      expect(result.count).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const id = 'notif-1';
      const userId = 'user-1';

      jest.spyOn(prismaService.notification, 'delete').mockResolvedValue(mockNotification);

      const result = await service.deleteNotification(id, userId);

      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(result).toEqual(mockNotification);
    });
  });
});
