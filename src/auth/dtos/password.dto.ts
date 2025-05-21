import {
  IsString,
  IsStrongPassword,
  IsNumberString,
  Length,
} from 'class-validator';

export class PasswordDto {
  @Length(6, 7)
  @IsNumberString()
  readonly id: string;

  @IsString()
  @IsStrongPassword()
  readonly password: string;
}
