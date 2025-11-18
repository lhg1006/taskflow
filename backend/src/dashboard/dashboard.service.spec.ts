import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockCards = [
    {
      id: 'card-1',
      title: 'Card 1',
      description: 'Desc 1',
      assigneeId: 'user-1',
      isCompleted: true,
      dueDate: new Date('2024-01-15'),
      labels: [],
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'card-2',
      title: 'Card 2',
      description: 'Desc 2',
      assigneeId: 'user-2',
      isCompleted: false,
      dueDate: null,
      labels: [],
      updatedAt: new Date('2024-01-09'),
    },
    {
      id: 'card-3',
      title: 'Card 3',
      description: 'Desc 3',
      assigneeId: 'user-1',
      isCompleted: false,
      dueDate: new Date(),
      labels: [],
      updatedAt: new Date('2024-01-08'),
    },
  ];

  const mockWorkspaces = [
    {
      id: 'workspace-1',
      name: 'Workspace 1',
      boards: [
        {
          id: 'board-1',
          name: 'Board 1',
          columns: [
            {
              id: 'column-1',
              title: 'To Do',
              cards: mockCards,
            },
          ],
        },
      ],
    },
  ];

  const mockRecentCards = mockCards.map((card) => ({
    ...card,
    column: {
      id: 'column-1',
      title: 'To Do',
      board: {
        id: 'board-1',
        name: 'Board 1',
      },
    },
    assignee: card.assigneeId === 'user-1' ? {
      id: 'user-1',
      name: 'User 1',
      email: 'user1@example.com',
      avatar: null,
    } : null,
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            workspace: {
              findMany: jest.fn(),
            },
            card: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatistics', () => {
    it('should return comprehensive dashboard statistics', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.overview).toBeDefined();
      expect(result.workspaceStats).toBeDefined();
      expect(result.dueDates).toBeDefined();
      expect(result.recentCards).toBeDefined();
      expect(result.myCards).toBeDefined();
    });

    it('should calculate overall statistics correctly', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.overview.totalWorkspaces).toBe(1);
      expect(result.overview.totalBoards).toBe(1);
      expect(result.overview.totalCards).toBe(3);
      expect(result.overview.completedCards).toBe(1);
      expect(result.overview.completionRate).toBe(33);
    });

    it('should calculate user-specific statistics correctly', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.overview.myCardsCount).toBe(2);
      expect(result.overview.myCompletedCards).toBe(1);
      expect(result.overview.myCompletionRate).toBe(50);
    });

    it('should calculate workspace statistics correctly', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.workspaceStats).toHaveLength(1);
      expect(result.workspaceStats[0].id).toBe('workspace-1');
      expect(result.workspaceStats[0].name).toBe('Workspace 1');
      expect(result.workspaceStats[0].totalCards).toBe(3);
      expect(result.workspaceStats[0].completedCards).toBe(1);
      expect(result.workspaceStats[0].completionRate).toBe(33);
    });

    it('should return recent cards', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.recentCards).toHaveLength(3);
      expect(result.recentCards[0]).toHaveProperty('id');
      expect(result.recentCards[0]).toHaveProperty('title');
      expect(result.recentCards[0]).toHaveProperty('column');
    });

    it('should return users own cards', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.myCards).toHaveLength(2);
      expect(result.myCards.every((card) => card.id === 'card-1' || card.id === 'card-3')).toBe(true);
    });

    it('should handle empty workspaces', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue([]);

      const result = await service.getStatistics('user-1');

      expect(result.overview.totalWorkspaces).toBe(0);
      expect(result.overview.totalBoards).toBe(0);
      expect(result.overview.totalCards).toBe(0);
      expect(result.overview.completionRate).toBe(0);
      expect(result.overview.myCompletionRate).toBe(0);
    });

    it('should calculate due dates correctly', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue(mockRecentCards as any);

      const result = await service.getStatistics('user-1');

      expect(result.dueDates).toHaveProperty('dueToday');
      expect(result.dueDates).toHaveProperty('dueThisWeek');
      expect(result.dueDates).toHaveProperty('overdue');
      expect(typeof result.dueDates.dueToday).toBe('number');
      expect(typeof result.dueDates.dueThisWeek).toBe('number');
      expect(typeof result.dueDates.overdue).toBe('number');
    });

    it('should limit my cards to 10', async () => {
      const manyCards = Array.from({ length: 15 }, (_, i) => ({
        id: `card-${i}`,
        title: `Card ${i}`,
        assigneeId: 'user-1',
        isCompleted: false,
        dueDate: null,
        labels: [],
      }));

      const workspaceWithManyCards = [{
        id: 'workspace-1',
        name: 'Workspace 1',
        boards: [{
          id: 'board-1',
          name: 'Board 1',
          columns: [{
            id: 'column-1',
            title: 'To Do',
            cards: manyCards,
          }],
        }],
      }];

      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(workspaceWithManyCards as any);
      jest.spyOn(prismaService.card, 'findMany').mockResolvedValue([]);

      const result = await service.getStatistics('user-1');

      expect(result.myCards).toHaveLength(10);
    });
  });
});
