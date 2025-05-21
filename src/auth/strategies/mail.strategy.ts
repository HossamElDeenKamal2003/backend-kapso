import { Injectable } from '@nestjs/common';
import { DataBaseService } from 'src/database/database.service';
import { CacheService } from 'src/cache/cache.service';
import { CatchError } from 'decorators/CatchError.decorator';
import { AuthStrategy } from './auth.strategy';
import { MailRegisterationDto, MailVerificationDto } from '../dtos/mail.dto';
import sendMail from 'utils/sendMail';
import languages from 'languages.json';
import { AuthStrategies } from '../dtos/auth.dto';

@Injectable()
export class MailStrategy extends AuthStrategy {
  name: AuthStrategies = AuthStrategies.Mail;
  constructor(
    private readonly cacheService: CacheService,
    private readonly database: DataBaseService,
  ) {
    super(database);
  }

  @CatchError()
  async login({ email, password }: MailRegisterationDto) {
    const authMail = await this.database.authByEmail.findUnique({
      where: { email },
      include: { user: true },
    });
    if (!authMail)
      return {
        messages: [
          { content: languages['login-mail-not-found'], isSuccess: false },
        ],
      };
    if (authMail.password != password)
      return {
        messages: [
          { content: languages['login-password-incorrect'], isSuccess: false },
        ],
      };
    return {
      user: authMail.user,
      messages: [{ content: languages['login-success'], isSuccess: true }],
    };
  }

  @CatchError()
  async register({ email, password }: MailRegisterationDto) {
    const isExist = await this.database.authByEmail.count({
      where: { email },
    });
    if (isExist)
      return {
        messages: [{ content: languages['email-exist'], isSuccess: true }],
      };
    const otp = this.generateOtp(5);
    await sendMail({ to: email, subject: 'otp', text: `this is otp ${otp}` });
    await this.cacheService.set(email, { password, otp }, 3 * 60);
    return {
      messages: [{ content: languages['otp-mail-send'], isSuccess: true }],
    };
  }

  @CatchError()
  async verify({ email, otp }: MailVerificationDto) {
    const cachedValue = await this.cacheService.get<{
      password: string;
      otp: number;
    }>(email);

    if (cachedValue && cachedValue?.otp == otp)
      return this.createUser({ email, password: cachedValue.password });
    return {
      messages: [{ content: languages['otp-invaild'], isSuccess: true }],
    };
  }

  @CatchError()
  private async createUser({ email, password }: MailRegisterationDto) {
    const username = await this.generateUsername();
    const user = await this.database.user.create({
      data: { username },
    });
    await this.database.authByEmail.create({
      data: {
        email,
        password,
        userId: user.id,
      },
    });
    return {
      user,
      messages: [{ content: languages['signup-success'], isSuccess: true }],
    };
  }
}
