import {
  IsString,
  IsEmail,
  IsStrongPassword,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class MailRegisterationDto {
  @IsString()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsStrongPassword()
  readonly password: string;
}

export class MailVerificationDto {
  @IsString()
  @IsEmail()
  readonly email: string;

  @IsInt()
  @Min(10000)
  @Max(99999)
  readonly otp: number;
}
