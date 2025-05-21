import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyReply } from 'fastify';
import { Reflector } from '@nestjs/core';
import { CACHE_METADATA_KEY } from 'decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheTime = this.reflector.get<number>(
      CACHE_METADATA_KEY,
      context.getHandler(),
    );

    if (cacheTime) {
      const reply = context.switchToHttp().getResponse<FastifyReply>();
      reply.header('Cache-Control', `public, max-age=${cacheTime}`);
    }

    return next.handle().pipe(tap(() => {}));
  }
}
