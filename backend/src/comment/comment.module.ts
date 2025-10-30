import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationModule],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
