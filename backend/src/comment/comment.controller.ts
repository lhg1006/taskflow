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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(user.id, createCommentDto);
  }

  @Get()
  findAllByCard(@CurrentUser() user: any, @Query('cardId') cardId: string) {
    return this.commentService.findAllByCard(cardId, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(id, user.id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentService.remove(id, user.id);
  }
}
