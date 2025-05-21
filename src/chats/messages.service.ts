import { Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { DataBaseService } from 'src/database/database.service';
import languages from 'languages.json';
import { Asset } from '@prisma/client';
import { ChatsService } from './chats.service';
import { Server } from 'socket.io';

@Injectable()
export class MessagesService {
  constructor(
    private readonly database: DataBaseService,
    private chatsService: ChatsService,
  ) {}

  @CatchError()
  async getMessages({
    limit,
    skip,
    userId,
    chatId,
  }: {
    limit: number;
    skip: number;
    userId: string;
    chatId: string;
  }) {
    return this.database.message.findMany({
      where: {
        chat: {
          id: chatId,
          members: {
            some: {
              userId,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            lastConnect: true,
          },
        },
        chat: true,
      },
      take: limit,
      skip,
    });
  }

  @CatchError()
  async isVaildMessage({ userId, chatId }: { userId: string; chatId: string }) {
    const count = await this.database.chat.count({
      where: {
        id: chatId,
        members: {
          some: { userId },
        },
      },
    });
    if (count == 0) throw { messages: [languages['message-invaild']] };
  }

  @CatchError()
  createMessage({
    userId,
    chatId,
    content,
    assets,
    record,
  }: {
    userId: string;
    chatId: string;
    content?: string;
    record?: string;
    assets: Asset[];
  }) {
    return this.database.message.create({
      data: {
        senderId: userId,
        chatId,
        content,
        assets,
        record,
      },
      include: {
        chat: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            lastConnect: true,
          },
        },
      },
    });
  }

  @CatchError()
  async searchMessage({
    userId,
    prompt,
    take,
    skip,
    connected,
  }: {
    userId: string;
    prompt: string;
    take: number;
    skip: number;
    connected: Set<string>;
  }) {
    return this.database.message.findMany({
      where: {
        chat: {
          members: {
            some: { userId },
          },
        },
        content: {
          contains: prompt,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        chat: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
      skip,
    });
  }

  @CatchError()
  async sendMessage({ message, server }: { message: any; server: Server }) {
    message?.chat.members.forEach(async ({ user: { id } }) => {
      const receiverSocket = await this.chatsService.getSocket({
        userId: id,
        server,
      });
      receiverSocket?.emit('message', message);
    });
  }
}
