import { Module } from '@nestjs/common';
import { CloudService } from './cloud.service';
import { AzureStrategy } from './strategies/azure.strategy';
import { CloudController } from './cloud.controller';

@Module({
  providers: [CloudService, AzureStrategy],
  controllers: [CloudController],
})
export class CloudModule {}
