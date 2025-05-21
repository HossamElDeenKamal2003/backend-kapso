import { Global, Module } from '@nestjs/common';
import { DataBaseService } from './database.service';

@Global()
@Module({
  providers: [DataBaseService],
  exports: [DataBaseService],
})
export class DatabaseModule {}
