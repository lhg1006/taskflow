import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ActivityService, ActivityType } from '../activity/activity.service';
import {
  NotificationService,
  NotificationType,
} from '../notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private notificationService: NotificationService,
  ) {}

  // Parse @mentions from comment content
  private parseMentions(content: string): string[] {
    const mentionRegex = /@([a-f0-9-]{36})/g; // Match @userId format (UUID)
    const matches = content.matchAll(mentionRegex);
    const mentions = Array.from(matches, (match) => match[1]);
    return [...new Set(mentions)]; // Remove duplicates
  }

  async create(userId: string, createCommentDto: CreateCommentDto) {
    // Check if card exists and user has access
    const card = await this.checkCardAccess(createCommentDto.cardId, userId);

    // Parse mentions from comment content
    const mentions = this.parseMentions(createCommentDto.content);

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        cardId: createCommentDto.cardId,
        authorId: userId,
        mentions,
      },
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
    });

    // Log activity
    await this.activityService.logActivity(
      createCommentDto.cardId,
      userId,
      ActivityType.ADD_COMMENT,
    );

    // Get author name for notifications
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Send notifications to mentioned users
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== userId) {
        // Don't notify yourself
        await this.notificationService.createNotification(
          mentionedUserId,
          NotificationType.MENTIONED,
          `${author?.name}님이 "${card.title}" 카드 댓글에서 회원님을 언급했습니다`,
          createCommentDto.cardId,
        );
      }
    }

    // Notify card assignee about new comment (if not the comment author and not already mentioned)
    if (card.assigneeId && card.assigneeId !== userId && !mentions.includes(card.assigneeId)) {
      await this.notificationService.createNotification(
        card.assigneeId,
        NotificationType.COMMENT_ADDED,
        `${author?.name}님이 "${card.title}" 카드에 댓글을 남겼습니다`,
        createCommentDto.cardId,
      );
    }

    return comment;
  }

  async findAllByCard(cardId: string, userId: string) {
    // Check if card exists and user has access
    await this.checkCardAccess(cardId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { cardId },
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
    });

    return comments;
  }

  async update(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        card: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author can update the comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: updateCommentDto.content,
      },
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
    });

    // Log activity
    await this.activityService.logActivity(
      comment.cardId,
      userId,
      ActivityType.UPDATE_COMMENT,
    );

    return updatedComment;
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        card: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author can delete the comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Log activity
    await this.activityService.logActivity(
      comment.cardId,
      userId,
      ActivityType.DELETE_COMMENT,
    );

    return { message: 'Comment deleted successfully' };
  }

  private async checkCardAccess(cardId: string, userId: string) {
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
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    await this.checkWorkspaceMember(card.column.board.workspaceId, userId);

    return card;
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
