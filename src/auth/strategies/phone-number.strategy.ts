import { Injectable } from '@nestjs/common';
import { DataBaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import languages from 'languages.json';
import { AuthStrategy } from './auth.strategy';
import { AuthStrategies } from '../dtos/auth.dto';
import { CatchError } from 'decorators/CatchError.decorator';
import {
  PhoneNumberLoginDto,
  PhoneNumberSignupDto,
  PhoneNumberVerifyDto,
} from '../dtos/phone-number.dto';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class PhoneNumberStrategy extends AuthStrategy {
  name: AuthStrategies = AuthStrategies.PhoneNumber;
  constructor(
    private readonly database: DataBaseService,
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {
    super(database);
  }

  @CatchError()
  async login({ phoneNumber }: PhoneNumberLoginDto) {
    return this.preVerify({ phoneNumber });
  }

  @CatchError()
  async verify({ phoneNumber, otp }: PhoneNumberVerifyDto) {
    const cached = await this.cacheService.get<
      { otp: string } & Partial<PhoneNumberSignupDto>
    >(phoneNumber);
    if (cached?.otp && otp == cached.otp) return this.createUser(cached);
    else
      return {
        messages: [{ content: languages['otp-invaild'], isSuccess: false }],
      };
  }

  @CatchError()
  async register({ phoneNumber, ...info }: PhoneNumberSignupDto) {
    const isUsed = await this.database.authByPhoneNumber.findFirst({
      where: { phoneNumber },
    });
    if (isUsed)
      return {
        messages: [
          { content: languages['phone-number-used'], isSuccess: false },
        ],
      };
    else return this.preVerify({ phoneNumber, ...info });
  }

  @CatchError()
  async preVerify({ phoneNumber, ...info }: Partial<PhoneNumberSignupDto>) {
    const otp = this.generateOtp(6);
    await this.cacheService.set(phoneNumber, { otp, ...info }, 2 * 60);
    return {
      otp,
      messages: [{ content: languages['otp-phone-send'], isSuccess: true }],
    };
  }

  @CatchError()
  private async createUser({
    name,
    phoneNumber,
    gender,
    birthDate,
    password,
  }: Partial<PhoneNumberSignupDto>) {
    const isExist = await this.database.authByPhoneNumber.findUnique({
      where: {
        phoneNumber,
      },
      include: {
        user: true,
      },
    });
    if (isExist)
      return {
        token: this.jwtService.sign({ id: isExist.user.id }),
        user: isExist.user,
        messages: [{ content: languages['signup-success'], isSuccess: true }],
      };

    const username = await this.generateUsername();
    const user = await this.database.user.create({
      data: { username, gender, birthDate, name },
    });
    await this.database.authByPhoneNumber.create({
      data: {
        phoneNumber,
        userId: user.id,
      },
    });
    await this.database.authByPassword.create({
      data: {
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
