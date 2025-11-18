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
import { LabelService } from './label.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createLabelDto: CreateLabelDto) {
    return this.labelService.create(user.id, createLabelDto);
  }

  @Get()
  findAllByBoard(
    @CurrentUser() user: any,
    @Query('boardId') boardId: string,
  ) {
    return this.labelService.findAllByBoard(boardId, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateLabelDto: UpdateLabelDto,
  ) {
    return this.labelService.update(id, user.id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.labelService.remove(id, user.id);
  }

  @Post('card/:cardId/label/:labelId')
  addLabelToCard(
    @Param('cardId') cardId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: any,
  ) {
    return this.labelService.addLabelToCard(cardId, labelId, user.id);
  }

  @Delete('card/:cardId/label/:labelId')
  removeLabelFromCard(
    @Param('cardId') cardId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: any,
  ) {
    return this.labelService.removeLabelFromCard(cardId, labelId, user.id);
  }
}
