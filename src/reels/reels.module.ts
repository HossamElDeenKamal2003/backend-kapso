import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ReelsService } from './reels.service';
import { ReelsController } from './reels.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ReelsService],
  controllers: [ReelsController],
})
export class ReelsModule {}
