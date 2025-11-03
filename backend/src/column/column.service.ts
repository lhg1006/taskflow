import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { BoardGateway } from '../board/board.gateway';

@Injectable()
export class ColumnService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BoardGateway))
    private boardGateway: BoardGateway,
  ) {}

  async create(userId: string, createColumnDto: CreateColumnDto) {
    // Check if board exists and user has access
    const board = await this.checkBoardAccess(createColumnDto.boardId, userId);

    // Get the current max order for the board
    const maxOrderColumn = await this.prisma.column.findFirst({
      where: { boardId: createColumnDto.boardId },
      orderBy: { order: 'desc' },
    });

    const order = createColumnDto.order ?? (maxOrderColumn?.order ?? -1) + 1;

    const column = await this.prisma.column.create({
      data: {
        title: createColumnDto.title,
        boardId: createColumnDto.boardId,
        order,
      },
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
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Emit real-time event
    this.boardGateway.emitColumnCreated(createColumnDto.boardId, column);

    return column;
  }

  async findAllByBoard(boardId: string, userId: string) {
    // Check if board exists and user has access
    await this.checkBoardAccess(boardId, userId);

    const columns = await this.prisma.column.findMany({
      where: { boardId },
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
    });

    return columns;
  }

  async findOne(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
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
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // Check workspace access
    await this.checkWorkspaceMember(column.board.workspaceId, userId);

    return column;
  }

  async update(
    columnId: string,
    userId: string,
    updateColumnDto: UpdateColumnDto,
  ) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: true,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // Check board access
    await this.checkBoardAccess(column.boardId, userId);

    const updatedColumn = await this.prisma.column.update({
      where: { id: columnId },
      data: updateColumnDto,
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
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Emit real-time event
    this.boardGateway.emitColumnUpdated(column.board.id, updatedColumn);

    return updatedColumn;
  }

  async remove(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: true,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // Check board access
    await this.checkBoardAccess(column.boardId, userId);

    const boardId = column.board.id;

    await this.prisma.column.delete({
      where: { id: columnId },
    });

    // Emit real-time event
    this.boardGateway.emitColumnDeleted(boardId, columnId);

    return { message: 'Column deleted successfully' };
  }

  private async checkBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.checkWorkspaceMember(board.workspaceId, userId);

    return board;
  }

  private async checkWorkspaceMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return member;
  }
}
