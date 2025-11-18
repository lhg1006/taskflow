import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum ActivityType {
  CREATE_CARD = 'CREATE_CARD',
  UPDATE_CARD = 'UPDATE_CARD',
  MOVE_CARD = 'MOVE_CARD',
  DELETE_CARD = 'DELETE_CARD',
  ADD_COMMENT = 'ADD_COMMENT',
  UPDATE_COMMENT = 'UPDATE_COMMENT',
  DELETE_COMMENT = 'DELETE_COMMENT',
  ASSIGN_USER = 'ASSIGN_USER',
  UNASSIGN_USER = 'UNASSIGN_USER',
  ADD_ATTACHMENT = 'ADD_ATTACHMENT',
  DELETE_ATTACHMENT = 'DELETE_ATTACHMENT',
  UPDATE_DUE_DATE = 'UPDATE_DUE_DATE',
  REMOVE_DUE_DATE = 'REMOVE_DUE_DATE',
  ADD_LABEL = 'ADD_LABEL',
  REMOVE_LABEL = 'REMOVE_LABEL',
  UPDATE_TITLE = 'UPDATE_TITLE',
  UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION',
  COMPLETE_CARD = 'COMPLETE_CARD',
  REOPEN_CARD = 'REOPEN_CARD',
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async logActivity(
    cardId: string,
    userId: string,
    actionType: ActivityType,
    details?: any,
  ) {
    return this.prisma.activityLog.create({
      data: {
        cardId,
        userId,
        actionType,
        details: details || {},
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getCardActivities(cardId: string) {
    return this.prisma.activityLog.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
