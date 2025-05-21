import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { UserDecorator } from 'decorators/user.decorator';
import { CacheService } from 'src/cache/cache.service';
import { MessagesService } from './messages.service';

@Controller('chats')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private cacheService: CacheService,
    private messagesService: MessagesService,
  ) {}

  @Get()
  async getChats(
    @UserDecorator({ idOnly: true }) userId: string,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('skip', ParseIntPipe) skip: number,
  ) {
    return this.chatsService.getChats({ limit, skip, userId });
  }

  @Get('/:chatId')
  async getMessages(
    @UserDecorator({ idOnly: true }) userId: string,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('skip', ParseIntPipe) skip: number,
    @Param('chatId') chatId: string,
  ) {
    return this.messagesService.getMessages({ limit, skip, userId, chatId });
  }

  @Get('/connected-users')
  async getConnectedUsers(@UserDecorator({ idOnly: true }) userId: string) {
    // const connected = await this.cacheService.getSet('users:connected');
    return this.chatsService.connectedUsers({
      userId,
      connected: ['673744cd1a54cba490be6776'],
    });
  }

  @Post('/:receiverId')
  async createChat(
    @UserDecorator({ idOnly: true }) senderId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.chatsService.createChat({ senderId, receiverId });
  }

  @Get('/search-message')
  async searchMessage(
    @UserDecorator({ idOnly: true }) userId: string,
    @Query('take', ParseIntPipe) take: number,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('prompt') prompt: string,
  ) {
    const connected = await this.cacheService.getSet('users:connected');
    return this.messagesService.searchMessage({
      userId,
      take,
      skip,
      prompt,
      connected: new Set(connected),
    });
  }
}
