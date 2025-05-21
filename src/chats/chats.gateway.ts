import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { Logger, ValidationPipe } from '@nestjs/common';
import { CallDTO, MessageDTO } from './chats.dto';
import { CacheService } from 'src/cache/cache.service';
import { Client, getClientId } from 'decorators/Client.decorator';
import { UserService } from 'src/user/user.service';
import { MessagesService } from './messages.service';
import { CallsService } from './calls.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  pingTimeout: 10000,
  pingInterval: 20000,
  transports: ['websocket'],
  path: '/messages',
  maxHttpBufferSize: 20000,
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatsGateway.name);

  constructor(
    private chatsService: ChatsService,
    private cacheService: CacheService,
    private messagesService: MessagesService,
    private callsService: CallsService,
  ) {}

  private async handleError({ socket, error }) {
    socket.emit('error', {
      messages: error.messages ?? [
        { en: error?.message ?? 'Invalid token', ar: 'حدث خطا ما' },
      ],
    });
    socket.disconnect();
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    try {
      const { id: userId } = await this.chatsService.getUserId({ socket });
      this.cacheService.set(`socket-id-of-${userId}`, socket.id, 3600);
      this.cacheService.addToSet('users:connected', [userId]);
      this.chatsService.userConnect({ userId });
      this.logger.log(`Conected: ${userId}`);
    } catch (error: any) {
      socket.emit('error', {
        messages: [{ en: error?.message ?? 'Invalid token', ar: 'حدث خطا ما' }],
      });
      socket.disconnect();
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe())
    { chatId, content, assets = [], record }: MessageDTO,
    @Client({ idOnly: true }) userId: string,
  ) {
    try {
      await this.messagesService.isVaildMessage({ userId, chatId });
      const createdMessage = await this.messagesService.createMessage({
        userId,
        chatId,
        content,
        assets,
        record,
      });
      this.messagesService.sendMessage({
        message: createdMessage,
        server: this.server,
      });
      return createdMessage;
    } catch (error: any) {
      this.handleError({ socket, error });
    }
  }

  @SubscribeMessage('call')
  async handleCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe())
    { offer, receiverId }: CallDTO,
    @Client({ idOnly: true }) userId: string,
  ) {
    try {
      return this.callsService.call({
        receiverId,
        senderId: userId,
        offer,
        server: this.server,
      });
    } catch (error: any) {
      this.handleError({ socket, error });
    }
  }

  @SubscribeMessage('block')
  async handleBlock(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe()) { blockedId }: { blockedId: string },
    @Client({ idOnly: true }) userId: string,
  ) {
    try {
      await this.chatsService.block({ blockerId: userId, blockedId });
      const receiverSocket = await this.chatsService.getSocket({
        userId: blockedId,
        server: this.server,
      });
      receiverSocket && receiverSocket.emit('block', { blockerId: userId });
    } catch (error: any) {
      this.handleError({ socket, error });
    }
  }

  @SubscribeMessage('unblock')
  async handleUnblock(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe()) { blockedId }: { blockedId: string },
    @Client({ idOnly: true }) userId: string,
  ) {
    try {
      await this.chatsService.unblock({ blockerId: userId, blockedId });
      const receiverSocket = await this.chatsService.getSocket({
        userId: blockedId,
        server: this.server,
      });
      receiverSocket && receiverSocket.emit('unblock', { blockerId: userId });
    } catch (error: any) {
      this.handleError({ socket, error });
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    try {
      const { id: userId } = await this.chatsService.getUserId({ socket });
      this.chatsService.userConnect({ userId });
      this.cacheService.del(userId);
      this.cacheService.removeFromSet('users:connected', [userId]);
      this.logger.log(`Disconected: ${userId}`);
    } catch (error: any) {
      this.handleError({ socket, error });
    }
  }
}
