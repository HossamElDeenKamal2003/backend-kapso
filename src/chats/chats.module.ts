import { Module, ValidationPipe } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { APP_PIPE } from '@nestjs/core';
import { CacheModule } from 'src/cache/cache.module';
import { ChatsGateway } from './chats.gateway';
import { UserModule } from 'src/user/user.module';
import { MessagesService } from './messages.service';
import { CallsService } from './calls.service';

@Module({
  imports: [DatabaseModule, CacheModule, UserModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    ChatsService,
    ChatsGateway,
    MessagesService,
    CallsService,
  ],
  controllers: [ChatsController],
})
export class ChatsModule {}
