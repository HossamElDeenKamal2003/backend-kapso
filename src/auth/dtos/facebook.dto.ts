import { IsString, IsEmail, IsOptional } from 'class-validator';

export class FacebookDto {
  @IsString()
  readonly id: string;

  @IsString()
  @IsEmail()
  readonly email: string;

  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly phoneNumber?: string;

  @IsOptional()
  @IsString()
  readonly username?: string;
}
