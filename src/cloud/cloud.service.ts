import { Injectable } from '@nestjs/common';
import { CloudStrategy } from './strategies/cloud.interface';
import { AzureStrategy } from './strategies/azure.strategy';

@Injectable()
export class CloudService {
  private strategy: CloudStrategy;

  constructor() {
    this.strategy = new AzureStrategy();
  }

  async generateSASToken({
    path,
    contentType,
  }: {
    path: string;
    contentType: string;
  }) {
    return {
      sasUrl: await this.strategy.generateSASToken({
        path,
        contentType,
      }),
    };
  }

  async makePublic(filePath: string) {
    return {
      publicUrl: await this.strategy.makePublic({ path: filePath }),
    };
  }
}
