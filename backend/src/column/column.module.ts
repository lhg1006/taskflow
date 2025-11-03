import { Module, forwardRef } from '@nestjs/common';
import { ColumnService } from './column.service';
import { ColumnController } from './column.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BoardModule), // Use forwardRef to avoid circular dependency
  ],
  providers: [ColumnService],
  controllers: [ColumnController],
})
export class ColumnModule {}
