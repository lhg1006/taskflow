import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService, NotificationType } from '../notification/notification.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let prismaService: PrismaService;
  let notificationService: NotificationService;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    avatar: null,
  };

  const mockInvitedUser = {
    id: 'invited-1',
    email: 'invited@example.com',
    name: 'Invited User',
    avatar: null,
  };

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'OWNER',
        user: mockUser,
      },
    ],
    boards: [],
  };

  const mockMember = {
    id: 'member-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    role: 'OWNER',
  };

  const mockAdminMember = {
    id: 'member-2',
    userId: 'admin-1',
    workspaceId: 'workspace-1',
    role: 'ADMIN',
  };

  const mockRegularMember = {
    id: 'member-3',
    userId: 'regular-1',
    workspaceId: 'workspace-1',
    role: 'MEMBER',
  };

  const mockInvitation = {
    id: 'invitation-1',
    workspaceId: 'workspace-1',
    invitedUserId: 'invited-1',
    role: 'MEMBER',
    status: 'PENDING',
    createdAt: new Date(),
    respondedAt: null,
    workspace: mockWorkspace,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        {
          provide: PrismaService,
          useValue: {
            workspace: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            workspaceMember: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            workspaceInvitation: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            notification: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createWorkspaceDto = {
      name: 'New Workspace',
      description: 'Workspace Description',
    };

    it('should create a workspace with user as owner', async () => {
      jest.spyOn(prismaService.workspace, 'create').mockResolvedValue(mockWorkspace as any);

      const result = await service.create('user-1', createWorkspaceDto);

      expect(prismaService.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'New Workspace',
          description: 'Workspace Description',
          members: {
            create: {
              userId: 'user-1',
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('findAll', () => {
    it('should return all workspaces user is a member of', async () => {
      const mockWorkspaces = [mockWorkspace];
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces as any);

      const result = await service.findAll('user-1');

      expect(prismaService.workspace.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId: 'user-1',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          boards: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockWorkspaces);
    });

    it('should return empty array if user has no workspaces', async () => {
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a workspace if user is a member', async () => {
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace as any);

      const result = await service.findOne('workspace-1', 'user-1');

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow('Workspace not found');
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const workspaceWithDifferentMember = {
        ...mockWorkspace,
        members: [{ ...mockMember, userId: 'other-user' }],
      };
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentMember as any);

      await expect(service.findOne('workspace-1', 'user-1')).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('workspace-1', 'user-1')).rejects.toThrow(
        'You are not a member of this workspace',
      );
    });
  });

  describe('update', () => {
    const updateWorkspaceDto = { name: 'Updated Workspace', description: 'Updated Description' };

    it('should update workspace when user is owner', async () => {
      const updatedWorkspace = { ...mockWorkspace, ...updateWorkspaceDto };
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.workspace, 'update').mockResolvedValue(updatedWorkspace as any);

      const result = await service.update('workspace-1', 'user-1', updateWorkspaceDto);

      expect(result.name).toBe('Updated Workspace');
      expect(result.description).toBe('Updated Description');
    });

    it('should update workspace when user is admin', async () => {
      const updatedWorkspace = { ...mockWorkspace, ...updateWorkspaceDto };
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any);
      jest.spyOn(prismaService.workspace, 'update').mockResolvedValue(updatedWorkspace as any);

      const result = await service.update('workspace-1', 'admin-1', updateWorkspaceDto);

      expect(result.name).toBe('Updated Workspace');
    });

    it('should throw ForbiddenException when user is regular member', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockRegularMember as any);

      await expect(service.update('workspace-1', 'regular-1', updateWorkspaceDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update('workspace-1', 'regular-1', updateWorkspaceDto)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.update('workspace-1', 'user-1', updateWorkspaceDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete workspace when user is owner', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.workspace, 'delete').mockResolvedValue(mockWorkspace as any);

      const result = await service.remove('workspace-1', 'user-1');

      expect(prismaService.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(result.message).toBe('Workspace deleted successfully');
    });

    it('should throw ForbiddenException when user is admin (not owner)', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any);

      await expect(service.remove('workspace-1', 'admin-1')).rejects.toThrow(ForbiddenException);
      await expect(service.remove('workspace-1', 'admin-1')).rejects.toThrow('Insufficient permissions');
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('workspace-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteMember', () => {
    const inviteMemberDto = { email: 'invited@example.com', role: 'MEMBER' };

    it('should create invitation successfully', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique')
        .mockResolvedValueOnce(mockMember as any)
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockInvitedUser as any);
      jest.spyOn(prismaService.workspaceInvitation, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.workspaceInvitation, 'create').mockResolvedValue(mockInvitation as any);
      jest.spyOn(prismaService.notification, 'create').mockResolvedValue({} as any);

      const result = await service.inviteMember('workspace-1', 'user-1', inviteMemberDto);

      expect(prismaService.workspaceInvitation.create).toHaveBeenCalled();
      expect(prismaService.notification.create).toHaveBeenCalled();
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException if invited user does not exist', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.inviteMember('workspace-1', 'user-1', inviteMemberDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.inviteMember('workspace-1', 'user-1', inviteMemberDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw ConflictException if user is already a member', async () => {
      const existingInvitedMember = {
        id: 'member-4',
        userId: 'invited-1',
        workspaceId: 'workspace-1',
        role: 'MEMBER',
      };
      jest.spyOn(prismaService.workspaceMember, 'findUnique')
        .mockImplementation((args: any) => {
          // First call: check permission for user-1 (the inviter)
          if (args.where.userId_workspaceId.userId === 'user-1') {
            return Promise.resolve(mockMember as any);
          }
          // Second call: check if invited-1 is already a member
          return Promise.resolve(existingInvitedMember as any);
        });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockInvitedUser as any);

      await expect(service.inviteMember('workspace-1', 'user-1', inviteMemberDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.inviteMember('workspace-1', 'user-1', inviteMemberDto)).rejects.toThrow(
        'User is already a member',
      );
    });

    it('should throw ConflictException if invitation already sent', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique')
        .mockImplementation((args: any) => {
          // First call: check permission for user-1 (the inviter)
          if (args.where.userId_workspaceId.userId === 'user-1') {
            return Promise.resolve(mockMember as any);
          }
          // Second call: check if invited-1 is already a member
          return Promise.resolve(null);
        });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockInvitedUser as any);
      jest.spyOn(prismaService.workspaceInvitation, 'findFirst').mockResolvedValue(mockInvitation as any);

      await expect(service.inviteMember('workspace-1', 'user-1', inviteMemberDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.inviteMember('workspace-1', 'user-1', inviteMemberDto)).rejects.toThrow(
        'Invitation already sent',
      );
    });

    it('should throw ForbiddenException if user has insufficient permissions', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockRegularMember as any);

      await expect(service.inviteMember('workspace-1', 'regular-1', inviteMemberDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and add member to workspace', async () => {
      const newMember = {
        ...mockRegularMember,
        userId: 'invited-1',
        user: mockInvitedUser,
        workspace: mockWorkspace,
      };
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(mockInvitation as any);
      jest.spyOn(prismaService.workspaceInvitation, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.workspaceMember, 'create').mockResolvedValue(newMember as any);

      const result = await service.acceptInvitation('invitation-1', 'invited-1');

      expect(prismaService.workspaceInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invitation-1' },
        data: {
          status: 'ACCEPTED',
          respondedAt: expect.any(Date),
        },
      });
      expect(prismaService.workspaceMember.create).toHaveBeenCalled();
      expect(result).toEqual(newMember);
    });

    it('should throw NotFoundException if invitation does not exist', async () => {
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(null);

      await expect(service.acceptInvitation('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.acceptInvitation('invalid-id', 'user-1')).rejects.toThrow(
        'Invitation not found',
      );
    });

    it('should throw ForbiddenException if invitation is not for the user', async () => {
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(mockInvitation as any);

      await expect(service.acceptInvitation('invitation-1', 'wrong-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.acceptInvitation('invitation-1', 'wrong-user')).rejects.toThrow(
        'This invitation is not for you',
      );
    });

    it('should throw ConflictException if invitation already responded', async () => {
      const respondedInvitation = { ...mockInvitation, status: 'ACCEPTED' };
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(respondedInvitation as any);

      await expect(service.acceptInvitation('invitation-1', 'invited-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.acceptInvitation('invitation-1', 'invited-1')).rejects.toThrow(
        'Invitation already responded',
      );
    });
  });

  describe('rejectInvitation', () => {
    it('should reject invitation successfully', async () => {
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(mockInvitation as any);
      jest.spyOn(prismaService.workspaceInvitation, 'update').mockResolvedValue({} as any);

      const result = await service.rejectInvitation('invitation-1', 'invited-1');

      expect(prismaService.workspaceInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invitation-1' },
        data: {
          status: 'REJECTED',
          respondedAt: expect.any(Date),
        },
      });
      expect(result.message).toBe('Invitation rejected');
    });

    it('should throw NotFoundException if invitation does not exist', async () => {
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(null);

      await expect(service.rejectInvitation('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if invitation is not for the user', async () => {
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(mockInvitation as any);

      await expect(service.rejectInvitation('invitation-1', 'wrong-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if invitation already responded', async () => {
      const respondedInvitation = { ...mockInvitation, status: 'REJECTED' };
      jest.spyOn(prismaService.workspaceInvitation, 'findUnique').mockResolvedValue(respondedInvitation as any);

      await expect(service.rejectInvitation('invitation-1', 'invited-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique')
        .mockResolvedValueOnce(mockAdminMember as any)
        .mockResolvedValueOnce(mockRegularMember as any);
      jest.spyOn(prismaService.workspaceMember, 'delete').mockResolvedValue(mockRegularMember as any);

      const result = await service.removeMember('workspace-1', 'regular-1', 'admin-1');

      expect(prismaService.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'regular-1',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(result.message).toBe('Member removed successfully');
    });

    it('should throw NotFoundException if member does not exist', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique')
        .mockImplementation((args: any) => {
          // First call: check permission for admin-1 (the remover)
          if (args.where.userId_workspaceId.userId === 'admin-1') {
            return Promise.resolve(mockAdminMember as any);
          }
          // Second call: find the member to be removed
          return Promise.resolve(null);
        });

      await expect(service.removeMember('workspace-1', 'invalid-id', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeMember('workspace-1', 'invalid-id', 'admin-1')).rejects.toThrow(
        'Member not found',
      );
    });

    it('should throw ForbiddenException when trying to remove owner', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique')
        .mockImplementation((args: any) => {
          // First call: check permission for admin-1 (the remover)
          if (args.where.userId_workspaceId.userId === 'admin-1') {
            return Promise.resolve(mockAdminMember as any);
          }
          // Second call: find user-1 (the owner to be removed)
          return Promise.resolve(mockMember as any);
        });

      await expect(service.removeMember('workspace-1', 'user-1', 'admin-1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.removeMember('workspace-1', 'user-1', 'admin-1')).rejects.toThrow(
        'Cannot remove workspace owner',
      );
    });

    it('should throw ForbiddenException if user has insufficient permissions', async () => {
      jest.spyOn(prismaService.workspaceMember, 'findUnique').mockResolvedValue(mockRegularMember as any);

      await expect(service.removeMember('workspace-1', 'other-user', 'regular-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
