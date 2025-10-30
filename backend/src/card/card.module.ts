import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationModule],
  providers: [CardService],
  controllers: [CardController],
})
export class CardModule {}
