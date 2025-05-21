import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { CatchError } from 'decorators/CatchError.decorator';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
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

  // Set cache with expiration time (in seconds)
  @CatchError()
  async set(key: string, value: any, ttlInSeconds: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.client.set(key, serializedValue, 'EX', ttlInSeconds);
  }

  @CatchError()
  async get<T>(key: string): Promise<T | null> {
    const cachedValue = await this.client.get(key);
    return cachedValue ? JSON.parse(cachedValue) : null;
  }

  @CatchError()
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  @CatchError()
  async exists(key: string): Promise<boolean> {
    const exists = await this.client.exists(key);
    return exists > 0;
  }

  @CatchError()
  async getSet(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  @CatchError()
  async addToSet(key: string, value: (string | number)[]): Promise<number> {
    return this.client.sadd(key, ...value);
  }

  @CatchError()
  async removeFromSet(
    key: string,
    value: (string | number)[],
  ): Promise<number> {
    return this.client.srem(key, ...value);
  }
}
