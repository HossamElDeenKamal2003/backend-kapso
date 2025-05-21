import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { MailStrategy } from './strategies/mail.strategy';
import { AuthStrategy } from './strategies/auth.strategy';
import { AuthStrategies } from './dtos/auth.dto';
import { GoogleStrategy } from './strategies/google.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { PasswordStrategy } from './strategies/password.strategy';
import { PhoneNumberStrategy } from './strategies/phone-number.strategy';

@Injectable()
export class AuthService {
  strategies: AuthStrategy[] = [];
  constructor(
    private readonly mailStrategy: MailStrategy,
    private readonly googleStrategy: GoogleStrategy,
    private readonly appleStrategy: AppleStrategy,
    private readonly passwordStrategy: PasswordStrategy,
    private readonly facebookStrategy: FacebookStrategy,
    private readonly phoneNumberStrategy: PhoneNumberStrategy,
  ) {
    this.strategies.push(
      this.passwordStrategy,
      this.phoneNumberStrategy,
      this.mailStrategy,
      this.googleStrategy,
      this.appleStrategy,
      this.facebookStrategy,
    );
  }

  @CatchError()
  async login(arg: any, strategy: AuthStrategies) {
    for (const authStrategy of this.strategies) {
      if (authStrategy.name == strategy) return authStrategy.login(arg);
    }
  }

  @CatchError()
  async register(arg: any, strategy: AuthStrategies) {
    if (this.phoneNumberStrategy.name == strategy)
      return this.phoneNumberStrategy.register(arg);
    else
      throw new HttpException('UnSupported Strategy', HttpStatus.BAD_REQUEST);
  }

  @CatchError()
  async verify(arg: any, strategy: AuthStrategies) {
    if (this.phoneNumberStrategy.name == strategy)
      return this.phoneNumberStrategy.verify(arg);
    else
      throw new HttpException('UnSupported Strategy', HttpStatus.BAD_REQUEST);
  }
}
