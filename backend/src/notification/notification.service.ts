import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum NotificationType {
  ASSIGNED = 'ASSIGNED',
  MENTIONED = 'MENTIONED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  DUE_DATE_SOON = 'DUE_DATE_SOON',
  CARD_MOVED = 'CARD_MOVED',
  WORKSPACE_INVITATION = 'WORKSPACE_INVITATION',
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    cardId?: string,
  ) {
    return this.prisma.notification.create({
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
  }

  async getUserNotifications(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            column: {
              select: {
                boardId: true,
              },
            },
          },
        },
        workspaceInvitation: {
          select: {
            id: true,
            status: true,
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async deleteNotification(id: string, userId: string) {
    return this.prisma.notification.delete({
      where: { id, userId },
    });
  }
}
