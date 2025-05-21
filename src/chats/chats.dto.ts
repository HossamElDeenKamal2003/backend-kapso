import { Asset } from '@prisma/client';
import { IsOptional, MinLength } from 'class-validator';

export class MessageDTO {
  chatId: string;

  @IsOptional()
  @MinLength(1)
  content?: string;

  @IsOptional()
  assets?: Asset[];

  @IsOptional()
  record?: string;
}

export class CallDTO {
  offer: RTCSessionDescription;

  @MinLength(8)
  receiverId: string;
}
