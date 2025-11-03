import { Module, forwardRef } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [
    PrismaModule,
    ActivityModule,
    NotificationModule,
    forwardRef(() => BoardModule), // Use forwardRef to avoid circular dependency
  ],
  providers: [CardService],
  controllers: [CardController],
})
export class CardModule {}
