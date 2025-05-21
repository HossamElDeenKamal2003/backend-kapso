import { Gender } from '@prisma/client';
import {
  IsString,
  IsPhoneNumber,
  IsIn,
  IsDate,
  IsNumberString,
  Length,
  IsStrongPassword,
  IsEnum,
} from 'class-validator';

export class PhoneNumberSignupDto {
  @IsString()
  readonly name: string;

  @IsString()
  @IsPhoneNumber()
  readonly phoneNumber: string;

  @IsString()
  @IsEnum(Gender)
  readonly gender: Gender;

  @IsDate()
  readonly birthDate: Date;

  @IsString()
  @IsStrongPassword()
  readonly password: string;
}

export class PhoneNumberLoginDto {
  @IsString()
  @IsPhoneNumber()
  readonly phoneNumber: string;
}

export class PhoneNumberVerifyDto {
  @IsString()
  @IsPhoneNumber()
  readonly phoneNumber: string;

  @Length(6, 7)
  @IsNumberString()
  readonly otp: string;
}
