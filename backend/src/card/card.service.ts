import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { ActivityService, ActivityType } from '../activity/activity.service';
import {
  NotificationService,
  NotificationType,
} from '../notification/notification.service';

@Injectable()
export class CardService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private notificationService: NotificationService,
  ) {}

  async create(userId: string, createCardDto: CreateCardDto) {
    // Check if column exists and user has access
    await this.checkColumnAccess(createCardDto.columnId, userId);

    // Get the current max order for the column
    const maxOrderCard = await this.prisma.card.findFirst({
      where: { columnId: createCardDto.columnId },
      orderBy: { order: 'desc' },
    });

    const order = createCardDto.order ?? (maxOrderCard?.order ?? -1) + 1;

    const card = await this.prisma.card.create({
      data: {
        title: createCardDto.title,
        description: createCardDto.description,
        columnId: createCardDto.columnId,
        assigneeId: createCardDto.assigneeId,
        creatorId: userId,
        order,
        dueDate: createCardDto.dueDate
          ? new Date(createCardDto.dueDate)
          : undefined,
        labels: createCardDto.labels || [],
      },
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
    });

    // Log activity
    await this.activityService.logActivity(
      card.id,
      userId,
      ActivityType.CREATE_CARD,
      { title: card.title },
    );

    return card;
  }

  async findAllByColumn(columnId: string, userId: string) {
    // Check if column exists and user has access
    await this.checkColumnAccess(columnId, userId);

    const cards = await this.prisma.card.findMany({
      where: { columnId },
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
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return cards;
  }

  async findOne(cardId: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check workspace access
    await this.checkWorkspaceMember(
      card.column.board.workspaceId,
      userId,
    );

    return card;
  }

  async update(cardId: string, userId: string, updateCardDto: UpdateCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check column access
    await this.checkColumnAccess(card.columnId, userId);

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        ...updateCardDto,
        dueDate: updateCardDto.dueDate
          ? new Date(updateCardDto.dueDate)
          : undefined,
      },
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
    });

    // Log specific activities based on what changed
    if (updateCardDto.title !== undefined && updateCardDto.title !== card.title) {
      await this.activityService.logActivity(
        cardId,
        userId,
        ActivityType.UPDATE_TITLE,
        { oldTitle: card.title, newTitle: updateCardDto.title },
      );
    }

    if (updateCardDto.description !== undefined && updateCardDto.description !== card.description) {
      await this.activityService.logActivity(
        cardId,
        userId,
        ActivityType.UPDATE_DESCRIPTION,
      );
    }

    if (updateCardDto.assigneeId !== undefined) {
      if (updateCardDto.assigneeId && updateCardDto.assigneeId !== card.assigneeId) {
        await this.activityService.logActivity(
          cardId,
          userId,
          ActivityType.ASSIGN_USER,
          { assigneeId: updateCardDto.assigneeId },
        );

        // Notify the assigned user (if not assigning themselves)
        if (updateCardDto.assigneeId !== userId) {
          const assigner = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });
          await this.notificationService.createNotification(
            updateCardDto.assigneeId,
            NotificationType.ASSIGNED,
            `${assigner?.name}님이 회원님을 "${updatedCard.title}" 카드의 담당자로 지정했습니다`,
            cardId,
          );
        }
      } else if (!updateCardDto.assigneeId && card.assigneeId) {
        await this.activityService.logActivity(
          cardId,
          userId,
          ActivityType.UNASSIGN_USER,
          { assigneeId: card.assigneeId },
        );
      }
    }

    if (updateCardDto.dueDate !== undefined) {
      const newDueDate = updateCardDto.dueDate ? new Date(updateCardDto.dueDate) : null;
      const oldDueDate = card.dueDate;

      if (newDueDate && (!oldDueDate || newDueDate.getTime() !== oldDueDate.getTime())) {
        await this.activityService.logActivity(
          cardId,
          userId,
          ActivityType.UPDATE_DUE_DATE,
          { dueDate: newDueDate },
        );
      } else if (!newDueDate && oldDueDate) {
        await this.activityService.logActivity(
          cardId,
          userId,
          ActivityType.REMOVE_DUE_DATE,
        );
      }
    }

    if (updateCardDto.labels !== undefined) {
      const oldLabels = card.labels || [];
      const newLabels = updateCardDto.labels || [];

      const addedLabels = newLabels.filter(l => !oldLabels.includes(l));
      const removedLabels = oldLabels.filter(l => !newLabels.includes(l));

      for (const label of addedLabels) {
        await this.activityService.logActivity(
          cardId,
          userId,
          ActivityType.ADD_LABEL,
          { label },
        );
      }

      for (const label of removedLabels) {
        await this.activityService.logActivity(
          cardId,
          userId,
          ActivityType.REMOVE_LABEL,
          { label },
        );
      }
    }

    return updatedCard;
  }

  async move(cardId: string, userId: string, moveCardDto: MoveCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check access for both old and new column
    const oldColumn = await this.checkColumnAccess(card.columnId, userId);
    const newColumn = await this.checkColumnAccess(moveCardDto.columnId, userId);

    // Move card
    const movedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        columnId: moveCardDto.columnId,
        order: moveCardDto.order,
      },
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
    });

    // Log activity if moved to different column
    if (card.columnId !== moveCardDto.columnId) {
      await this.activityService.logActivity(
        cardId,
        userId,
        ActivityType.MOVE_CARD,
        {
          fromColumn: oldColumn.title,
          toColumn: newColumn.title,
        },
      );
    }

    return movedCard;
  }

  async remove(cardId: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check column access
    await this.checkColumnAccess(card.columnId, userId);

    await this.prisma.card.delete({
      where: { id: cardId },
    });

    return { message: 'Card deleted successfully' };
  }

  private async checkColumnAccess(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkWorkspaceMember(column.board.workspaceId, userId);

    return column;
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
