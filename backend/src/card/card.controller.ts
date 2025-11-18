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
import { SearchCardDto } from './dto/search-card.dto';
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

  @Get('search')
  searchCards(
    @CurrentUser() user: any,
    @Query('boardId') boardId: string,
    @Query() filters: SearchCardDto,
  ) {
    return this.cardService.searchCards(boardId, user.id, filters);
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

  @Patch(':id/toggle-completed')
  toggleCompleted(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.toggleCompleted(id, user.id);
  }

  @Post(':id/copy')
  copy(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.copy(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.remove(id, user.id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.archive(id, user.id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardService.unarchive(id, user.id);
  }

  @Get('board/:boardId/archived')
  getArchivedCards(
    @Param('boardId') boardId: string,
    @CurrentUser() user: any,
  ) {
    return this.cardService.getArchivedCards(boardId, user.id);
  }

  // Checklist endpoints
  @Post(':cardId/checklist')
  addChecklistItem(
    @Param('cardId') cardId: string,
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    return this.cardService.addChecklistItem(cardId, user.id, content);
  }

  @Patch(':cardId/checklist/:itemId')
  updateChecklistItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    return this.cardService.updateChecklistItem(itemId, user.id, content);
  }

  @Patch(':cardId/checklist/:itemId/toggle')
  toggleChecklistItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.cardService.toggleChecklistItem(itemId, user.id);
  }

  @Delete(':cardId/checklist/:itemId')
  deleteChecklistItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.cardService.deleteChecklistItem(itemId, user.id);
  }

}
