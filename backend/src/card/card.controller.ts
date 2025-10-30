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
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createCardDto: CreateCardDto) {
    return this.cardService.create(user.id, createCardDto);
  }

  @Get()
  findAllByColumn(@CurrentUser() user: any, @Query('columnId') columnId: string) {
    return this.cardService.findAllByColumn(columnId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardService.update(id, user.id, updateCardDto);
  }

  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() moveCardDto: MoveCardDto,
  ) {
    return this.cardService.move(id, user.id, moveCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.remove(id, user.id);
  }
}
