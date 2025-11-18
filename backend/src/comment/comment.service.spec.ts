import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';

describe('CommentService', () => {
  let service: CommentService;
  let prismaService: PrismaService;
  let activityService: ActivityService;
  let notificationService: NotificationService;

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    assigneeId: 'assignee-1',
    column: {
      board: {
        id: 'board-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1' },
      },
    },
  };

  const mockComment = {
    id: 'comment-1',
    content: 'Test comment',
    cardId: 'card-1',
    authorId: 'user-1',
    mentions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
    },
    card: mockCard,
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
        CommentService,
        {
          provide: PrismaService,
          useValue: {
            comment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            card: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            workspaceMember: {
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
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    prismaService = module.get<PrismaService>(PrismaService);
    activityService = module.get<ActivityService>(ActivityService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCommentDto = {
      content: 'Test comment',
      cardId: 'card-1',
    };

    it('should create a comment successfully', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.comment, 'create').mockResolvedValue(mockComment as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ name: 'Test User' } as any);

      const result = await service.create('user-1', createCommentDto);

      expect(prismaService.comment.create).toHaveBeenCalled();
      expect(activityService.logActivity).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });

    it('should parse and save mentions', async () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '123e4567-e89b-12d3-a456-426614174000';
      const commentWithMentions = {
        ...createCommentDto,
        content: `Hello @${userId1} and @${userId2}!`,
      };

      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.comment, 'create').mockResolvedValue(mockComment as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ name: 'Test User' } as any);

      await service.create('user-1', commentWithMentions);

      expect(prismaService.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mentions: expect.arrayContaining([userId1, userId2]),
          }),
        }),
      );
    });

    it('should send notifications to mentioned users', async () => {
      const mentionedUserId = '550e8400-e29b-41d4-a716-446655440000';
      const commentWithMention = {
        ...createCommentDto,
        content: `Hello @${mentionedUserId}!`,
      };

      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.comment, 'create').mockResolvedValue(mockComment as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ name: 'Test User' } as any);

      await service.create('user-1', commentWithMention);

      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('should notify card assignee about new comment', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.comment, 'create').mockResolvedValue(mockComment as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ name: 'Test User' } as any);

      await service.create('user-1', createCommentDto);

      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createCommentDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByCard', () => {
    it('should return all comments for a card', async () => {
      const mockComments = [mockComment];
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.comment, 'findMany').mockResolvedValue(mockComments as any);

      const result = await service.findAllByCard('card-1', 'user-1');

      expect(result).toEqual(mockComments);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findAllByCard('card-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateCommentDto = { content: 'Updated comment' };

    it('should update a comment successfully', async () => {
      const updatedComment = { ...mockComment, content: 'Updated comment' };
      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(mockComment as any);
      jest.spyOn(prismaService.comment, 'update').mockResolvedValue(updatedComment as any);

      const result = await service.update('comment-1', 'user-1', updateCommentDto);

      expect(activityService.logActivity).toHaveBeenCalled();
      expect(result.content).toBe('Updated comment');
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(null);

      await expect(service.update('invalid-id', 'user-1', updateCommentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(mockComment as any);

      await expect(service.update('comment-1', 'other-user', updateCommentDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update('comment-1', 'other-user', updateCommentDto)).rejects.toThrow(
        'You can only edit your own comments',
      );
    });
  });

  describe('remove', () => {
    it('should delete a comment successfully', async () => {
      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(mockComment as any);
      jest.spyOn(prismaService.comment, 'delete').mockResolvedValue(mockComment as any);

      const result = await service.remove('comment-1', 'user-1');

      expect(prismaService.comment.delete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
      expect(activityService.logActivity).toHaveBeenCalled();
      expect(result.message).toBe('Comment deleted successfully');
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      jest.spyOn(prismaService.comment, 'findUnique').mockResolvedValue(mockComment as any);

      await expect(service.remove('comment-1', 'other-user')).rejects.toThrow(ForbiddenException);
      await expect(service.remove('comment-1', 'other-user')).rejects.toThrow(
        'You can only delete your own comments',
      );
    });
  });
});
