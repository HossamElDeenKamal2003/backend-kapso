import { IsOptional } from 'class-validator';
import { isExpoPushToken } from 'decorators/DTOs';

export class AddTokenDto {
  @isExpoPushToken()
  token: string;
}
