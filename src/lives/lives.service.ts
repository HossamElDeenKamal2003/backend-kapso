import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { LiveType, RoomServiceGrpc } from 'types/Live';
import { CreateLiveDto, GetLivesDto, JoinLivesDto } from './lives.dto';
import { DataBaseService } from 'src/database/database.service';
import { OnEvent } from '@nestjs/event-emitter';
import { CatchError } from 'decorators/CatchError.decorator';
import { User } from '@prisma/client';

@Injectable()
export class LivesService implements OnModuleInit {
  private readonly logger = new Logger(LivesService.name);
  @Client({
    transport: Transport.GRPC,
    options: {
      url: process.env.ROOM_SERVICE_URL,
      package: 'room',
      protoPath: join(__dirname, '../../proto/room.proto'),
    },
  })
  private client: ClientGrpc;

  private roomService: RoomServiceGrpc;

  constructor(private readonly database: DataBaseService) {}

  onModuleInit() {
    this.roomService = this.client.getService<RoomServiceGrpc>('Room');
  }

  @CatchError()
  async createLive(
    user: User,
    { offer, title, tags, image, liveType }: CreateLiveDto,
  ) {
    const live = await this.database.live.create({
      data: {
        title,
        image,
        liveTags: { create: tags.map((tagId) => ({ tagId })) },
        liveType,
        closeAt: new Date(0),
        launchAt: new Date(0),
      },
    });
    return this.roomService
      .Create({
        offer,
        liveId: live.id,
        liveType: liveType == 'video' ? LiveType.video : LiveType.audio,
        peerInfo: user,
      })
      .toPromise();
  }

  @CatchError()
  async joinRoom({
    offer,
    roomId,
    user,
  }: {
    offer: string;
    roomId: string;
    user: User;
  }): Promise<string> {
    const response = await this.roomService
      .Join({
        offer,
        roomId,
        peerInfo: user,
        hasAudioAccess: false,
        hasVideoAccess: false,
      })
      .toPromise();
    return response.answer;
  }

  @CatchError()
  getTags() {
    return this.database.tag.findMany();
  }

  @OnEvent('new_room')
  @CatchError()
  launchLive({
    roomId,
    liveId,
    userId,
  }: {
    roomId: string;
    liveId: string;
    userId: string;
  }) {
    this.logger.log('new room handling.........', { roomId, liveId });
    return this.database.live.update({
      where: { id: liveId },
      data: {
        launchAt: new Date(),
        room: {
          create: {
            roomId,
            members: {
              create: {
                userId,
                exitAt: new Date(0),
              },
            },
          },
        },
      },
    });
  }

  @OnEvent('room_closed')
  @CatchError()
  closeLive({ liveId }: { liveId: string }) {
    this.logger.log('exit room handling.........');
    return this.database.live.update({
      where: { id: liveId },
      data: { closeAt: new Date() },
    });
  }

  @OnEvent('peer_join')
  @CatchError()
  joinMember({ roomId, userId }: { roomId: string; userId: string }) {
    this.logger.log('join member handling.........');
    return this.database.room.update({
      where: { roomId },
      data: {
        members: {
          create: {
            userId,
            exitAt: new Date(0),
          },
        },
      },
    });
  }

  @OnEvent('peer_exit')
  @CatchError()
  async exitMember({ roomId, userId }: { roomId: string; userId: string }) {
    this.logger.log('exit member handling.........');
    return this.database.roomMember.updateMany({
      where: {
        userId,
        room: {
          roomId,
        },
      },
      data: {
        exitAt: new Date(),
      },
    });
  }

  @CatchError()
  getLives({ skipLives, take, tagId, type, sortBy }: GetLivesDto) {
    console.log({ skipLives, take, tagId, type, sortBy });
    return this.database.live.findMany({
      // where: {
      //   id: {
      //     notIn: skipLives,
      //   },
      //   closeAt: new Date(0),
      //   liveType: type,
      //   launchAt: { not: new Date(0) },
      // },
      take,
      include: {
        room: {
          include: {
            _count: {
              select: { members: { where: { exitAt: new Date(0) } } },
            },
          },
        },
      },
      orderBy: {
        room: {
          members: { _count: 'desc' },
        },
      },
    });
  }

  @CatchError()
  async joinLive(user: User, { offer, liveId }: JoinLivesDto) {
    const {
      room: { roomId },
    } = await this.database.live.findUnique({
      where: { id: liveId },
      include: { room: true },
    });
    const answer = await this.joinRoom({ offer, roomId, user });
    return { answer };
  }
}
