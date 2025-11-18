import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CardService } from './card.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService, ActivityType } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';
import { BoardGateway } from '../board/board.gateway';

describe('CardService', () => {
  let service: CardService;
  let prismaService: PrismaService;
  let activityService: ActivityService;
  let notificationService: NotificationService;
  let boardGateway: BoardGateway;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
  };

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    workspaceId: 'workspace-1',
    workspace: {
      id: 'workspace-1',
      members: [],
    },
  };

  const mockColumn = {
    id: 'column-1',
    title: 'To Do',
    boardId: 'board-1',
    board: mockBoard,
  };

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    columnId: 'column-1',
    assigneeId: 'user-1',
    creatorId: 'user-1',
    order: 0,
    isCompleted: false,
    isArchived: false,
    dueDate: null,
    labels: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: mockUser,
    creator: mockUser,
    column: mockColumn,
  };

  const mockMember = {
    id: 'member-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    role: 'MEMBER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: PrismaService,
          useValue: {
            card: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            column: {
              findUnique: jest.fn(),
            },
            board: {
              findUnique: jest.fn(),
            },
            workspaceMember: {
              findUnique: jest.fn(),
            },
            checklistItem: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ActivityService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
        {
          provide: BoardGateway,
          useValue: {
            emitCardCreated: jest.fn(),
            emitCardUpdated: jest.fn(),
            emitCardMoved: jest.fn(),
            emitCardDeleted: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    prismaService = module.get<PrismaService>(PrismaService);
    activityService = module.get<ActivityService>(ActivityService);
    notificationService = module.get<NotificationService>(NotificationService);
    boardGateway = module.get<BoardGateway>(BoardGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCardDto = {
      title: 'New Card',
      description: 'Card Description',
      columnId: 'column-1',
      assigneeId: 'user-1',
    };

    it('should create a card successfully', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.card, 'create').mockResolvedValue(mockCard as any);

      const result = await service.create('user-1', createCardDto);

      expect(prismaService.card.create).toHaveBeenCalled();
      expect(activityService.logActivity).toHaveBeenCalledWith(
        mockCard.id,
        'user-1',
        ActivityType.CREATE_CARD,
        { title: mockCard.title },
      );
      expect(boardGateway.emitCardCreated).toHaveBeenCalled();
      expect(result).toEqual(mockCard);
    });

    it('should auto-increment order when no order provided', async () => {
      const existingCard = { ...mockCard, order: 2 };
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'findFirst').mockResolvedValue(existingCard as any);
      jest.spyOn(prismaService.card, 'create').mockResolvedValue(mockCard as any);

      await service.create('user-1', createCardDto);

      expect(prismaService.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 3,
          }),
        }),
      );
    });

    it('should throw NotFoundException if column does not exist', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createCardDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createCardDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByColumn', () => {
    it('should return all cards in a column', async () => {
      const mockCards = [mockCard];
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockCards as any);

      const result = await service.findAllByColumn('column-1', 'user-1');

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            columnId: 'column-1',
            isArchived: false,
          }),
        }),
      );
      expect(result).toEqual(mockCards);
    });

    it('should exclude archived cards', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue([]);

      await service.findAllByColumn('column-1', 'user-1');

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: false,
          }),
        }),
      );
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findAllByColumn('column-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a card by id', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);

      const result = await service.findOne('card-1', 'user-1');

      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow('Card not found');
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('card-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateCardDto = { title: 'Updated Card', description: 'Updated Description' };

    it('should update a card successfully', async () => {
      const updatedCard = { ...mockCard, ...updateCardDto };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'update').mockResolvedValue(updatedCard as any);

      const result = await service.update('card-1', 'user-1', updateCardDto);

      expect(activityService.logActivity).toHaveBeenCalled();
      expect(result.title).toBe('Updated Card');
      expect(result.description).toBe('Updated Description');
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.update('invalid-id', 'user-1', updateCardDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.update('card-1', 'user-1', updateCardDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a card successfully', async () => {
      const cardWithColumn = { ...mockCard, column: mockColumn };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(cardWithColumn as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'delete').mockResolvedValue(mockCard as any);

      const result = await service.remove('card-1', 'user-1');

      expect(prismaService.card.delete).toHaveBeenCalledWith({ where: { id: 'card-1' } });
      expect(boardGateway.emitCardDeleted).toHaveBeenCalled();
      expect(result.message).toBe('Card deleted successfully');
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('card-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleCompleted', () => {
    it('should toggle card completion status to true', async () => {
      const completedCard = { ...mockCard, isCompleted: true };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'update').mockResolvedValue(completedCard as any);

      const result = await service.toggleCompleted('card-1', 'user-1');

      expect(result.isCompleted).toBe(true);
      expect(activityService.logActivity).toHaveBeenCalled();
    });

    it('should toggle card completion status to false', async () => {
      const completedCard = { ...mockCard, isCompleted: true };
      const incompletedCard = { ...mockCard, isCompleted: false };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(completedCard as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'update').mockResolvedValue(incompletedCard as any);

      const result = await service.toggleCompleted('card-1', 'user-1');

      expect(result.isCompleted).toBe(false);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.toggleCompleted('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive', () => {
    it('should archive a card successfully', async () => {
      const archivedCard = { ...mockCard, isArchived: true };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.card, 'update').mockResolvedValue(archivedCard as any);

      const result = await service.archive('card-1', 'user-1');

      expect(result.isArchived).toBe(true);
      expect(activityService.logActivity).toHaveBeenCalled();
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.archive('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
