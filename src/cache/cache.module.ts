import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { PubService } from './publisher.service';
import { SubService } from './subscriber.service';

@Global()
@Module({
  providers: [CacheService, CacheInterceptor, PubService, SubService],
  exports: [CacheService, CacheInterceptor, PubService, SubService],
})
export class CacheModule {}
