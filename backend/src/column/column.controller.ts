import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('columns')
@UseGuards(JwtAuthGuard)
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createColumnDto: CreateColumnDto) {
    return this.columnService.create(user.id, createColumnDto);
  }

  @Get()
  findAllByBoard(
    @CurrentUser() user: any,
    @Query('boardId') boardId: string,
  ) {
    return this.columnService.findAllByBoard(boardId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.columnService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateColumnDto: UpdateColumnDto,
  ) {
    return this.columnService.update(id, user.id, updateColumnDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.columnService.remove(id, user.id);
  }
}
