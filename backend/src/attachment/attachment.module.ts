import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentController } from './attachment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  providers: [AttachmentService, PrismaService],
  controllers: [AttachmentController],
})
export class AttachmentModule {}
