import { Injectable } from '@nestjs/common';
import { DataBaseService } from 'src/database/database.service';
import { GoogleDto } from '../dtos/google.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthStrategy } from './auth.strategy';
import { AuthStrategies } from '../dtos/auth.dto';
import languages from 'languages.json';
import { CatchError } from 'decorators/CatchError.decorator';

@Injectable()
export class GoogleStrategy extends AuthStrategy {
  name: AuthStrategies = AuthStrategies.Google;
  constructor(
    private readonly database: DataBaseService,
    private readonly jwtService: JwtService,
  ) {
    super(database);
  }

  @CatchError()
  async login({ id, name, email, phoneNumber, username }: GoogleDto) {
    const auth = await this.database.authByGoogle.update({
      where: { email },
      include: { user: true },
      data: { clientId: id, name, email, phoneNumber },
    });

    const user =
      auth?.user ??
      (await this.database.user.create({
        data: {
          username: await this.generateUsername(),
          name,
          authByGoogle: {
            create: {
              clientId: id,
              email,
              phoneNumber,
              username,
            },
          },
        },
      }));

    return {
      token: this.jwtService.sign({ id: user.id }),
      user,
      messages: [{ content: languages['login-success'], isSuccess: true }],
    };
  }
}
