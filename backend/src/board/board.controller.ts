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
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createBoardDto: CreateBoardDto) {
    return this.boardService.create(user.id, createBoardDto);
  }

  @Get()
  findAllByWorkspace(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.boardService.findAllByWorkspace(workspaceId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.boardService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardService.update(id, user.id, updateBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.boardService.remove(id, user.id);
  }
}
