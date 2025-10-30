import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBoardDto: CreateBoardDto) {
    // Check if user is a member of the workspace
    await this.checkWorkspaceMember(createBoardDto.workspaceId, userId);

    const board = await this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        description: createBoardDto.description,
        workspaceId: createBoardDto.workspaceId,
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

    return board;
  }

  async findAllByWorkspace(workspaceId: string, userId: string) {
    // Check if user is a member of the workspace
    await this.checkWorkspaceMember(workspaceId, userId);

    const boards = await this.prisma.board.findMany({
      where: {
        workspaceId,
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

    return boards;
  }

  async findOne(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
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

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the workspace
    await this.checkWorkspaceMember(board.workspaceId, userId);

    return board;
  }

  async update(boardId: string, userId: string, updateBoardDto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the workspace
    await this.checkWorkspaceMember(board.workspaceId, userId);

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
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

    return updatedBoard;
  }

  async remove(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user has admin/owner permission
    await this.checkWorkspacePermission(board.workspaceId, userId, [
      'OWNER',
      'ADMIN',
    ]);

    await this.prisma.board.delete({
      where: { id: boardId },
    });

    return { message: 'Board deleted successfully' };
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

  private async checkWorkspacePermission(
    workspaceId: string,
    userId: string,
    allowedRoles: string[],
  ) {
    const member = await this.checkWorkspaceMember(workspaceId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}
