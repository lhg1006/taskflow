import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ColumnService } from './column.service';
import { PrismaService } from '../prisma/prisma.service';
import { BoardGateway } from '../board/board.gateway';

describe('ColumnService', () => {
  let service: ColumnService;
  let prismaService: PrismaService;
  let boardGateway: BoardGateway;

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    workspaceId: 'workspace-1',
    workspace: {
      id: 'workspace-1',
      name: 'Test Workspace',
    },
  };

  const mockColumn = {
    id: 'column-1',
    title: 'To Do',
    boardId: 'board-1',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    board: mockBoard,
    cards: [],
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
        ColumnService,
        {
          provide: PrismaService,
          useValue: {
            column: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            board: {
              findUnique: jest.fn(),
            },
            workspaceMember: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: BoardGateway,
          useValue: {
            emitColumnCreated: jest.fn(),
            emitColumnUpdated: jest.fn(),
            emitColumnDeleted: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ColumnService>(ColumnService);
    prismaService = module.get<PrismaService>(PrismaService);
    boardGateway = module.get<BoardGateway>(BoardGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createColumnDto = {
      title: 'New Column',
      boardId: 'board-1',
    };

    it('should create a column successfully', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.column, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.column, 'create').mockResolvedValue(mockColumn as any);

      const result = await service.create('user-1', createColumnDto);

      expect(prismaService.board.findUnique).toHaveBeenCalled();
      expect(prismaService.workspaceMember.findUnique).toHaveBeenCalled();
      expect(prismaService.column.create).toHaveBeenCalled();
      expect(boardGateway.emitColumnCreated).toHaveBeenCalled();
      expect(result).toEqual(mockColumn);
    });

    it('should auto-increment order when no order provided', async () => {
      const existingColumn = { ...mockColumn, order: 2 };
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.column, 'findFirst').mockResolvedValue(existingColumn as any);
      jest.spyOn(prismaService.column, 'create').mockResolvedValue(mockColumn as any);

      await service.create('user-1', createColumnDto);

      expect(prismaService.column.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 3,
          }),
        }),
      );
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createColumnDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createColumnDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByBoard', () => {
    it('should return all columns for a board', async () => {
      const mockColumns = [mockColumn];
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.column, 'findMany').mockResolvedValue(mockColumns as any);

      const result = await service.findAllByBoard('board-1', 'user-1');

      expect(result).toEqual(mockColumns);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findAllByBoard('board-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a column by id', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);

      const result = await service.findOne('column-1', 'user-1');

      expect(result).toEqual(mockColumn);
    });

    it('should throw NotFoundException if column does not exist', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('column-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateColumnDto = { title: 'Updated Title' };

    it('should update a column successfully', async () => {
      const updatedColumn = { ...mockColumn, title: 'Updated Title' };
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.column, 'update').mockResolvedValue(updatedColumn as any);

      const result = await service.update('column-1', 'user-1', updateColumnDto);

      expect(boardGateway.emitColumnUpdated).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if column does not exist', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(null);

      await expect(service.update('invalid-id', 'user-1', updateColumnDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a column successfully', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(mockColumn as any);
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.column, 'delete').mockResolvedValue(mockColumn as any);

      const result = await service.remove('column-1', 'user-1');

      expect(prismaService.column.delete).toHaveBeenCalledWith({ where: { id: 'column-1' } });
      expect(boardGateway.emitColumnDeleted).toHaveBeenCalled();
      expect(result.message).toBe('Column deleted successfully');
    });

    it('should throw NotFoundException if column does not exist', async () => {
      jest.spyOn(prismaService.column, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
