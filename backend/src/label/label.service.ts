import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelService {
  constructor(private prisma: PrismaService) {}

  // Check if user has access to the board
  private async checkBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.workspace.members.length === 0) {
      throw new ForbiddenException(
        'You do not have access to this board',
      );
    }

    return board;
  }

  // Create a new label
  async create(userId: string, createLabelDto: CreateLabelDto) {
    await this.checkBoardAccess(createLabelDto.boardId, userId);

    const label = await this.prisma.label.create({
      data: {
        name: createLabelDto.name,
        color: createLabelDto.color,
        boardId: createLabelDto.boardId,
      },
    });

    return label;
  }

  // Get all labels for a board
  async findAllByBoard(boardId: string, userId: string) {
    await this.checkBoardAccess(boardId, userId);

    const labels = await this.prisma.label.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    });

    return labels;
  }

  // Update a label
  async update(labelId: string, userId: string, updateLabelDto: UpdateLabelDto) {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: { board: true },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    await this.checkBoardAccess(label.boardId, userId);

    const updatedLabel = await this.prisma.label.update({
      where: { id: labelId },
      data: updateLabelDto,
    });

    return updatedLabel;
  }

  // Delete a label
  async remove(labelId: string, userId: string) {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: { board: true },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    await this.checkBoardAccess(label.boardId, userId);

    // Delete the label (cascade will handle CardLabel entries)
    await this.prisma.label.delete({
      where: { id: labelId },
    });

    return { message: 'Label deleted successfully' };
  }

  // Add label to card
  async addLabelToCard(cardId: string, labelId: string, userId: string) {
    // Check if card exists and user has access
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.column.board.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have access to this card');
    }

    // Check if label exists and belongs to the same board
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    if (label.boardId !== card.column.board.id) {
      throw new ForbiddenException('Label does not belong to this board');
    }

    // Check if already added
    const existing = await this.prisma.cardLabel.findFirst({
      where: {
        cardId,
        labelId,
      },
    });

    if (existing) {
      return { message: 'Label already added to card' };
    }

    // Add label to card
    await this.prisma.cardLabel.create({
      data: {
        cardId,
        labelId,
      },
    });

    return { message: 'Label added to card successfully' };
  }

  // Remove label from card
  async removeLabelFromCard(cardId: string, labelId: string, userId: string) {
    // Check if card exists and user has access
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.column.board.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have access to this card');
    }

    // Remove label from card
    const cardLabel = await this.prisma.cardLabel.findFirst({
      where: {
        cardId,
        labelId,
      },
    });

    if (!cardLabel) {
      throw new NotFoundException('Label not found on card');
    }

    await this.prisma.cardLabel.delete({
      where: { id: cardLabel.id },
    });

    return { message: 'Label removed from card successfully' };
  }
}
