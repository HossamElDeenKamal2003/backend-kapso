import { Controller, Get, Patch, Query } from '@nestjs/common';
import { CloudService } from './cloud.service';
import { UserDecorator } from 'decorators/user.decorator';
import { v4 as uuidv4 } from 'uuid';

@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Get('generate-sas')
  async getSASToken(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
    @UserDecorator({ idOnly: true }) userId: string,
  ) {
    return this.cloudService.generateSASToken({
      path: `${userId}/${uuidv4()}-${filename}`,
      contentType,
    });
  }

  @Patch('makePublic')
  async makePublic(
    @Query('filePath') filePath: string,
    @UserDecorator({ idOnly: true }) userId: string,
  ) {
    return await this.cloudService.makePublic(filePath);
  }
}
