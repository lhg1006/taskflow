import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(
    @CurrentUser() user: any,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.getUserNotifications(
      user.id,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.deleteNotification(id, user.id);
  }
}
