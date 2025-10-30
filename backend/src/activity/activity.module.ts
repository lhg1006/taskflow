import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ActivityService, PrismaService],
  controllers: [ActivityController],
  exports: [ActivityService], // Export so other modules can use it
})
export class ActivityModule {}
