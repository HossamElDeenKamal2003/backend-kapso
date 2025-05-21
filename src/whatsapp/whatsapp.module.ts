import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { WhatsAppService } from './whatsapp.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [DatabaseModule, ConfigModule, HttpModule],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsappModule {}
