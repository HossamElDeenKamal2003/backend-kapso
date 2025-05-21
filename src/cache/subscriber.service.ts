import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { CatchError } from 'decorators/CatchError.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SubService implements OnModuleInit, OnModuleDestroy {
  constructor(private eventEmitter: EventEmitter2) {}

  private readonly logger = new Logger(SubService.name);
  private subClient: Redis;
  private channels: string[] = [
    'new_room',
    'room_closed',
    'peer_join',
    'peer_exit',
  ];

  onModuleInit() {
    this.subClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      password: process.env.REDIS_PASSWORD,
    });
    this.logger.log(`start subscribe for ${this.channels} `);
    this.channels.forEach((channel: string) => {
      this.subscribe(channel, (message) => {
        this.eventEmitter.emit(channel, JSON.parse(JSON.stringify(message)));
      });
    });
  }

  onModuleDestroy() {
    this.subClient.quit();
  }

  @CatchError()
  private async subscribe(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    await this.subClient.subscribe(channel);
    this.subClient.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(JSON.parse(message));
      }
    });
  }
}
