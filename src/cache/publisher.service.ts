import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { CatchError } from 'decorators/CatchError.decorator';

@Injectable()
export class PubService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      password: process.env.REDIS_PASSWORD,
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  @CatchError()
  async publishMessage(channel: string, message: any): Promise<void> {
    const serializedMessage = JSON.stringify(message);
    await this.client.publish(channel, serializedMessage);
  }
}
