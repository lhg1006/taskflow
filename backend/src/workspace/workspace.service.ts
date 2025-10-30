import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import {
  NotificationService,
  NotificationType,
} from '../notification/notification.service';

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: createWorkspaceDto.name,
        description: createWorkspaceDto.description,
        members: {
          create: {
            userId,
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

    return workspace;
  }

  async findAll(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
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

    return workspaces;
  }

  async findOne(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
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
        boards: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is a member
    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return workspace;
  }

  async update(
    workspaceId: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    // Check permission
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN']);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateWorkspaceDto,
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

    return workspace;
  }

  async remove(workspaceId: string, userId: string) {
    // Only owner can delete workspace
    await this.checkPermission(workspaceId, userId, ['OWNER']);

    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace deleted successfully' };
  }

  async inviteMember(
    workspaceId: string,
    userId: string,
    inviteMemberDto: InviteMemberDto,
  ) {
    // Check permission
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN']);

    // Find user by email
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: inviteMemberDto.email },
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedUser.id,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    // Check if user has pending invitation
    const pendingInvitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        invitedUserId: invitedUser.id,
        status: 'PENDING',
      },
    });

    if (pendingInvitation) {
      throw new ConflictException('Invitation already sent');
    }

    // Always create new invitation (allows multiple invitations over time)
    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        invitedUserId: invitedUser.id,
        role: inviteMemberDto.role,
      },
      include: {
        workspace: true,
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: invitedUser.id,
        type: NotificationType.WORKSPACE_INVITATION,
        message: `"${invitation.workspace.name}" 워크스페이스에 초대되었습니다`,
        workspaceInvitationId: invitation.id,
      },
    });

    return invitation;
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Invitation already responded');
    }

    // Update invitation status
    await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Add member to workspace
    const member = await this.prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        workspace: true,
      },
    });

    return member;
  }

  async rejectInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Invitation already responded');
    }

    // Update invitation status
    await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return { message: 'Invitation rejected' };
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    userId: string,
  ) {
    // Check permission
    await this.checkPermission(workspaceId, userId, ['OWNER', 'ADMIN']);

    // Cannot remove owner
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  private async checkPermission(
    workspaceId: string,
    userId: string,
    allowedRoles: string[],
  ) {
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

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}
