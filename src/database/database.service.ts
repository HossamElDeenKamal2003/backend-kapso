import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient } from '@prisma/client';

type OnResult = (result: any) => Promise<any> | any;

@Injectable()
export class DataBaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private eventEmitter: EventEmitter2) {
    super();
  }

  private handleCreateNotification(args: any) {
    // args.include = { user: true };
    // return async (notification: Notification) => {
    //   await this.eventEmitter.emitAsync('notification.create', notification);
    // };
    return () => args;
  }

  async onModuleInit() {
    this.$use(async (params, next) => {
      let onResult: OnResult = (result) => result;
      switch (`${params.model}.${params.action}`) {
        case 'Notification.createx':
          onResult = this.handleCreateNotification(params.args);
          break;
      }

      const before = Date.now();
      const result = await next(params);
      console.info(
        `Query: ${params.model}.${params.action} => ${Date.now() - before}ms`,
      );
      await onResult(result);
      return result;
    });
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
