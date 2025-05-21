import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from './cache/cache.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReelsModule } from './reels/reels.module';
import { UserModule } from './user/user.module';
import { PostsModule } from './posts/posts.module';
import { CloudModule } from './cloud/cloud.module';
import { ChatsModule } from './chats/chats.module';
import { StreamModule } from './stream/stream.module';
import { LivesModule } from './lives/lives.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { FamilyModule } from './family/family.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    NotificationsModule,
    AuthModule,
    ReelsModule,
    DatabaseModule,
    HttpModule,
    CacheModule,
    UserModule,
    PostsModule,
    CloudModule,
    ChatsModule,
    StreamModule,
    LivesModule,
    WhatsappModule,
    FamilyModule,
  ],
  controllers: [],
})
export class AppModule {}
