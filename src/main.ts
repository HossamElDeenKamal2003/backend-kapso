import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppGuard } from './app.guard';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { LoggingInterceptor } from './logging.interceptor';
import { CacheInterceptor } from './cache/cache.interceptor';
import { ValidationPipe } from '@nestjs/common';

const port = process.env.PORT || 8000;
const host = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors();
  app.useGlobalGuards(new AppGuard());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new CacheInterceptor(new Reflector()),
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
