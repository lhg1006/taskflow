import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.create(user.id, createWorkspaceDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workspaceService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspaceService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(id, user.id, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspaceService.remove(id, user.id);
  }

  @Post(':id/invite')
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.workspaceService.inviteMember(id, user.id, inviteMemberDto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.workspaceService.removeMember(id, memberId, user.id);
  }

  @Post('invitations/:invitationId/accept')
  acceptInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.workspaceService.acceptInvitation(invitationId, user.id);
  }

  @Post('invitations/:invitationId/reject')
  rejectInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.workspaceService.rejectInvitation(invitationId, user.id);
  }
}
