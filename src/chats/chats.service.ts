import { Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { DataBaseService } from 'src/database/database.service';
import { CacheService } from 'src/cache/cache.service';
import { Server, Socket } from 'socket.io';
import { getClientId } from 'decorators/Client.decorator';
import { ChatType } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(
    private readonly database: DataBaseService,
    private cacheService: CacheService,
  ) {}

  @CatchError()
  async getChats({
    limit,
    skip,
    userId,
  }: {
    limit: number;
    skip: number;
    userId: string;
  }) {
    return this.database.chat.findMany({
      where: {
        type: ChatType.CHAT,
        members: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
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
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        members: {
          where: {
            userId: { not: userId },
          },
          select: {
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                lastConnect: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
    });
  }

  @CatchError()
  async getChat({ userId1, userId2 }: { userId1: string; userId2: string }) {
    return this.database.chat.findFirst({
      where: {
        type: ChatType.CHAT,
        members: {
          some: { AND: [{ userId: userId1 }, { userId: userId2 }] },
        },
      },
    });
  }

  @CatchError()
  async block({
    blockerId,
    blockedId,
  }: {
    blockerId: string;
    blockedId: string;
  }) {
    return this.database.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  @CatchError()
  async unblock({
    blockerId,
    blockedId,
  }: {
    blockerId: string;
    blockedId: string;
  }) {
    return this.database.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  @CatchError()
  async connectedUsers({
    userId,
    connected,
  }: {
    userId: string;
    connected: string[];
  }) {
    return this.database.follower.findMany({
      where: {
        followerId: userId,
        followingId: { in: connected },
      },
      select: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            lastConnect: true,
            chats: {
              where: {
                chat: {
                  type: 'CHAT',
                  members: {
                    some: {
                      userId: userId,
                    },
                  },
                },
              },
              select: {
                chatId: true,
              },
            },
          },
        },
      },
    });
  }

  @CatchError()
  async userConnect({ userId }: { userId: string }) {
    return this.database.user.update({
      where: { id: userId },
      data: { lastConnect: new Date() },
    });
  }

  @CatchError()
  createChat({
    senderId,
    receiverId,
  }: {
    senderId: string;
    receiverId: string;
  }) {
    return this.database.chat.create({
      data: {
        type: ChatType.CHAT,
        members: {
          createMany: {
            data: [
              {
                userId: senderId,
                status: { isMute: false, lastSeen: new Date() },
              },
              {
                userId: receiverId,
                status: { isMute: false, lastSeen: new Date() },
              },
            ],
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                lastConnect: true,
              },
            },
          },
        },
      },
    });
  }

  async getSocket({ userId, server }: { userId: string; server: Server }) {
    const socketId = await this.cacheService.get<string>(userId);
    return socketId ? server.sockets.sockets.get(socketId) : null;
  }

  async getUserId({ socket }: { socket: Socket }) {
    const access = socket.handshake.headers['x-server-access'];
    if (access != process.env.SERVER_ACCESS)
      throw new Error('invaild connection');
    const token = socket.handshake.headers.authorization?.split(' ')?.at(-1);
    return getClientId(token);
  }
}
