import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStatistics(userId: string) {
    // 사용자가 속한 워크스페이스 조회
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        boards: {
          include: {
            columns: {
              include: {
                cards: true,
              },
            },
          },
        },
      },
    });

    // 전체 통계 계산
    const totalWorkspaces = workspaces.length;
    const totalBoards = workspaces.reduce(
      (sum, ws) => sum + ws.boards.length,
      0,
    );

    // 모든 카드 가져오기
    const allCards = workspaces.flatMap((ws) =>
      ws.boards.flatMap((board) =>
        board.columns.flatMap((column) => column.cards),
      ),
    );

    const totalCards = allCards.length;
    const myCards = allCards.filter((card) => card.assigneeId === userId);
    const completedCards = allCards.filter((card) => card.isCompleted).length;
    const myCompletedCards = myCards.filter((card) => card.isCompleted).length;

    // 워크스페이스별 통계
    const workspaceStats = workspaces.map((workspace) => {
      const cards = workspace.boards.flatMap((board) =>
        board.columns.flatMap((column) => column.cards),
      );
      const totalCards = cards.length;
      const completedCards = cards.filter((card) => card.isCompleted).length;

      return {
        id: workspace.id,
        name: workspace.name,
        totalCards,
        completedCards,
        completionRate:
          totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0,
      };
    });

    // 마감일 현황
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const dueTodayCards = allCards.filter((card) => {
      if (!card.dueDate) return false;
      const dueDate = new Date(card.dueDate);
      return (
        dueDate.getFullYear() === today.getFullYear() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getDate() === today.getDate()
      );
    });

    const dueThisWeekCards = allCards.filter((card) => {
      if (!card.dueDate) return false;
      const dueDate = new Date(card.dueDate);
      return dueDate >= today && dueDate <= endOfWeek;
    });

    const overdueCards = allCards.filter((card) => {
      if (!card.dueDate) return false;
      return new Date(card.dueDate) < today;
    });

    // 최근 활동 카드 (최근 업데이트된 10개)
    const recentCards = await this.prisma.card.findMany({
      where: {
        column: {
          board: {
            workspace: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
      include: {
        column: {
          select: {
            id: true,
            title: true,
            board: {
              select: {
                id: true,
                name: true,
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
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    return {
      overview: {
        totalWorkspaces,
        totalBoards,
        totalCards,
        completedCards,
        completionRate:
          totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0,
        myCardsCount: myCards.length,
        myCompletedCards,
        myCompletionRate:
          myCards.length > 0
            ? Math.round((myCompletedCards / myCards.length) * 100)
            : 0,
      },
      workspaceStats,
      dueDates: {
        dueToday: dueTodayCards.length,
        dueThisWeek: dueThisWeekCards.length,
        overdue: overdueCards.length,
      },
      recentCards: recentCards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        dueDate: card.dueDate,
        labels: card.labels,
        assignee: card.assignee,
        column: card.column,
        updatedAt: card.updatedAt,
        isCompleted: card.isCompleted,
      })),
      myCards: myCards.slice(0, 10).map((card) => ({
        id: card.id,
        title: card.title,
        dueDate: card.dueDate,
        labels: card.labels,
      })),
    };
  }
}
