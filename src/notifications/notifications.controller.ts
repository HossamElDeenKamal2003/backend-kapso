import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { UserDecorator } from 'decorators/user.decorator';
import { AddTokenDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationService: NotificationsService) {}

  @Get()
  async getNotifications(
    @UserDecorator({ idOnly: true }) userId: string,
    @Query('take', ParseIntPipe) take: number,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('type') type: string,
  ) {
    return this.notificationService.getNotifications({
      skip,
      userId,
      take,
      type,
    });
  }

  @Post('token')
  async addToken(
    @UserDecorator({ idOnly: true }) userId: string,
    @Body(new ValidationPipe()) { token }: AddTokenDto,
  ) {
    return this.notificationService.addToken({ token, userId });
  }

  @Patch('seen')
  async seen(@UserDecorator({ idOnly: true }) userId: string) {
    return this.notificationService.seen({ userId });
  }
}
