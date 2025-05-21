import { Injectable } from '@nestjs/common';
import { DataBaseService } from 'src/database/database.service';
import { ChatsService } from './chats.service';
import { CacheService } from 'src/cache/cache.service';
import { UserService } from 'src/user/user.service';
import { CatchError } from 'decorators/CatchError.decorator';
import { Server } from 'socket.io';

@Injectable()
export class CallsService {
  constructor(
    private chatsService: ChatsService,
    private cacheService: CacheService,
    private userService: UserService,
    private database: DataBaseService,
  ) {}

  @CatchError()
  async call({
    receiverId,
    senderId,
    offer,
    server,
  }: {
    offer: RTCSessionDescription;
    receiverId: string;
    senderId: string;
    server: Server;
  }) {
    if (await this.userService.isFriends(senderId, receiverId)) {
      const connected = await this.cacheService.getSet('users:connected');
      if (connected.includes(receiverId)) {
        const { id: chatId } = await this.chatsService.getChat({
          userId1: senderId,
          userId2: receiverId,
        });
        if (chatId) {
          const receiverSocket = await this.chatsService.getSocket({
            userId: receiverId,
            server,
          });
          receiverSocket?.emit('call', { offer: offer.toJSON() });
          this.database.message.create({
            data: {
              chatId,
              senderId,
              call: { isReceived: true, isAnswered: false },
            },
          });
        }
      } else
        return [
          {
            content: {
              ar: 'المستخدم غير متصل الآن.',
              en: 'User is not connected now.',
            },
            isSuccess: false,
          },
        ];
    } else
      return [
        {
          content: {
            ar: 'يمكنك فقط الاتصال بأصدقائك.',
            en: 'You can only call your friends.',
          },
          isSuccess: false,
        },
      ];
  }

  @CatchError()
  async answerCall({
    receiverId,
    senderId,
    answer,
    callId,
    server,
  }: {
    answer: string;
    callId: string;
    receiverId: string;
    senderId: string;
    server: Server;
  }) {
    const { id: chatId } = await this.chatsService.getChat({
      userId1: senderId,
      userId2: receiverId,
    });
    if (chatId) {
      const {
        call: { endAt },
      } = await this.database.message.update({
        where: { id: callId },
        data: { call: { isReceived: true, isAnswered: true } },
      });
      if (!endAt) {
        const senderSocket = await this.chatsService.getSocket({
          userId: senderId,
          server,
        });
        senderSocket?.emit('call_answer', { answer });
      }
    }
  }
}
