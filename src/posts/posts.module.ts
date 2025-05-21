import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PostsService } from './posts.service';
import { PostController } from './posts.controller';

@Module({
  imports: [DatabaseModule],
  providers: [PostsService],
  controllers: [PostController],
})
export class PostsModule {}
