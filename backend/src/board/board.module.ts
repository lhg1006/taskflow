import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { BoardGateway } from './board.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BoardService, BoardGateway],
  controllers: [BoardController],
  exports: [BoardGateway], // Export for use in other modules
})
export class BoardModule {}
