import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardService } from './board.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BoardService', () => {
  let service: BoardService;
  let prismaService: PrismaService;

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
  };

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    description: 'Test Description',
    workspaceId: 'workspace-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: mockWorkspace,
  };

  const mockColumn = {
    id: 'column-1',
    title: 'To Do',
    order: 0,
  };

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    order: 0,
    assignee: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
    },
    creator: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
    },
  };

  const mockMember = {
    id: 'member-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    role: 'MEMBER',
  };

  const mockAdminMember = {
    id: 'member-2',
    userId: 'admin-1',
    workspaceId: 'workspace-1',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: PrismaService,
          useValue: {
            board: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            workspaceMember: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBoardDto = {
      name: 'New Board',
      description: 'Board Description',
      workspaceId: 'workspace-1',
    };

    it('should create a board successfully', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.board, 'create').mockResolvedValue(mockBoard as any);

      const result = await service.create('user-1', createBoardDto);

      expect(prismaService.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prismaService.board.create).toHaveBeenCalledWith({
        data: {
          name: 'New Board',
          description: 'Board Description',
          workspaceId: 'workspace-1',
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockBoard);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createBoardDto)).rejects.toThrow(ForbiddenException);
      await expect(service.create('user-1', createBoardDto)).rejects.toThrow(
        'You are not a member of this workspace',
      );
    });
  });

  describe('findAllByWorkspace', () => {
    it('should return all boards in a workspace', async () => {
      const mockBoards = [mockBoard];
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.board, 'findMany').mockResolvedValue(mockBoards as any);

      const result = await service.findAllByWorkspace('workspace-1', 'user-1');

      expect(prismaService.board.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
        },
        include: {
          columns: {
            select: {
              id: true,
              title: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockBoards);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findAllByWorkspace('workspace-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return empty array when workspace has no boards', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.board, 'findMany').mockResolvedValue([]);

      const result = await service.findAllByWorkspace('workspace-1', 'user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a board with columns and cards', async () => {
      const boardWithDetails = {
        ...mockBoard,
        columns: [
          {
            ...mockColumn,
            cards: [mockCard],
          },
        ],
      };
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(boardWithDetails as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);

      const result = await service.findOne('board-1', 'user-1');

      expect(prismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
          columns: {
            include: {
              cards: {
                include: {
                  assignee: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                  creator: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
      expect(result).toEqual(boardWithDetails);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow('Board not found');
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateBoardDto = { name: 'Updated Board', description: 'Updated Description' };

    it('should update a board successfully', async () => {
      const updatedBoard = { ...mockBoard, ...updateBoardDto };
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.board, 'update').mockResolvedValue(updatedBoard as any);

      const result = await service.update('board-1', 'user-1', updateBoardDto);

      expect(prismaService.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: updateBoardDto,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result.name).toBe('Updated Board');
      expect(result.description).toBe('Updated Description');
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(service.update('invalid-id', 'user-1', updateBoardDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.update('board-1', 'user-1', updateBoardDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a board successfully when user is admin', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any);
      jest.spyOn(prismaService.board, 'delete').mockResolvedValue(mockBoard as any);

      const result = await service.remove('board-1', 'admin-1');

      expect(prismaService.board.delete).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
      expect(result.message).toBe('Board deleted successfully');
    });

    it('should delete a board successfully when user is owner', async () => {
      const ownerMember = { ...mockMember, role: 'OWNER' };
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(ownerMember as any);
      jest.spyOn(prismaService.board, 'delete').mockResolvedValue(mockBoard as any);

      const result = await service.remove('board-1', 'user-1');

      expect(result.message).toBe('Board deleted successfully');
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not admin or owner', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);

      await expect(service.remove('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
      await expect(service.remove('board-1', 'user-1')).rejects.toThrow('Insufficient permissions');
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
