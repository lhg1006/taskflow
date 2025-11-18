import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LabelService } from './label.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LabelService', () => {
  let service: LabelService;
  let prismaService: PrismaService;

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    workspaceId: 'workspace-1',
    workspace: {
      id: 'workspace-1',
      members: [{ userId: 'user-1', role: 'MEMBER' }],
    },
  };

  const mockLabel = {
    id: 'label-1',
    name: 'Bug',
    color: '#ff0000',
    boardId: 'board-1',
    createdAt: new Date(),
    board: mockBoard,
  };

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    column: {
      id: 'column-1',
      board: mockBoard,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelService,
        {
          provide: PrismaService,
          useValue: {
            label: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            board: {
              findUnique: jest.fn(),
            },
            card: {
              findUnique: jest.fn(),
            },
            cardLabel: {
              findFirst: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LabelService>(LabelService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createLabelDto = {
      name: 'Bug',
      color: '#ff0000',
      boardId: 'board-1',
    };

    it('should create a label successfully', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.label, 'create').mockResolvedValue(mockLabel as any);

      const result = await service.create('user-1', createLabelDto);

      expect(prismaService.label.create).toHaveBeenCalledWith({
        data: createLabelDto,
      });
      expect(result).toEqual(mockLabel);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(service.create('user-1', createLabelDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const boardWithoutMember = { ...mockBoard, workspace: { ...mockBoard.workspace, members: [] } };
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(boardWithoutMember as any);

      await expect(service.create('user-1', createLabelDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByBoard', () => {
    it('should return all labels for a board', async () => {
      const mockLabels = [mockLabel];
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.label, 'findMany').mockResolvedValue(mockLabels as any);

      const result = await service.findAllByBoard('board-1', 'user-1');

      expect(result).toEqual(mockLabels);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const boardWithoutMember = { ...mockBoard, workspace: { ...mockBoard.workspace, members: [] } };
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(boardWithoutMember as any);

      await expect(service.findAllByBoard('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateLabelDto = { name: 'Critical Bug', color: '#ff00ff' };

    it('should update a label successfully', async () => {
      const updatedLabel = { ...mockLabel, ...updateLabelDto };
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(mockLabel as any);
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.label, 'update').mockResolvedValue(updatedLabel as any);

      const result = await service.update('label-1', 'user-1', updateLabelDto);

      expect(result.name).toBe('Critical Bug');
    });

    it('should throw NotFoundException if label does not exist', async () => {
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(null);

      await expect(service.update('invalid-id', 'user-1', updateLabelDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a label successfully', async () => {
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(mockLabel as any);
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.label, 'delete').mockResolvedValue(mockLabel as any);

      const result = await service.remove('label-1', 'user-1');

      expect(prismaService.label.delete).toHaveBeenCalledWith({ where: { id: 'label-1' } });
      expect(result.message).toBe('Label deleted successfully');
    });

    it('should throw NotFoundException if label does not exist', async () => {
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addLabelToCard', () => {
    it('should add label to card successfully', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(mockLabel as any);
      jest.spyOn(prismaService.cardLabel, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.cardLabel, 'create').mockResolvedValue({} as any);

      const result = await service.addLabelToCard('card-1', 'label-1', 'user-1');

      expect(prismaService.cardLabel.create).toHaveBeenCalledWith({
        data: {
          cardId: 'card-1',
          labelId: 'label-1',
        },
      });
      expect(result.message).toBe('Label added to card successfully');
    });

    it('should return message if label already added', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(mockLabel as any);
      jest.spyOn(prismaService.cardLabel, 'findFirst').mockResolvedValue({ id: 'cardlabel-1' } as any);

      const result = await service.addLabelToCard('card-1', 'label-1', 'user-1');

      expect(result.message).toBe('Label already added to card');
      expect(prismaService.cardLabel.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if label does not belong to board', async () => {
      const labelFromDifferentBoard = { ...mockLabel, boardId: 'different-board' };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(labelFromDifferentBoard as any);

      await expect(service.addLabelToCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.addLabelToCard('invalid-id', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if label does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.label, 'findUnique').mockResolvedValue(null);

      await expect(service.addLabelToCard('card-1', 'invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeLabelFromCard', () => {
    it('should remove label from card successfully', async () => {
      const mockCardLabel = { id: 'cardlabel-1', cardId: 'card-1', labelId: 'label-1' };
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.cardLabel, 'findFirst').mockResolvedValue(mockCardLabel as any);
      jest.spyOn(prismaService.cardLabel, 'delete').mockResolvedValue(mockCardLabel as any);

      const result = await service.removeLabelFromCard('card-1', 'label-1', 'user-1');

      expect(prismaService.cardLabel.delete).toHaveBeenCalledWith({
        where: { id: 'cardlabel-1' },
      });
      expect(result.message).toBe('Label removed from card successfully');
    });

    it('should throw NotFoundException if label not found on card', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(mockCard as any);
      jest.spyOn(prismaService.cardLabel, 'findFirst').mockResolvedValue(null);

      await expect(service.removeLabelFromCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if card does not exist', async () => {
      jest.spyOn(prismaService.card, 'findUnique').mockResolvedValue(null);

      await expect(service.removeLabelFromCard('invalid-id', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
