import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  async getCardActivities(@Query('cardId') cardId: string) {
    if (!cardId) {
      throw new BadRequestException('cardId is required');
    }
    return this.activityService.getCardActivities(cardId);
  }
}
