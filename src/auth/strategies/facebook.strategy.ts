import { Injectable } from '@nestjs/common';
import { DataBaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import languages from 'languages.json';
import { AuthStrategy } from './auth.strategy';
import { AppleDto } from '../dtos/apple.dto';
import { AuthStrategies } from '../dtos/auth.dto';
import { CatchError } from 'decorators/CatchError.decorator';

@Injectable()
export class FacebookStrategy extends AuthStrategy {
  name: AuthStrategies = AuthStrategies.Facebook;
  constructor(
    private readonly database: DataBaseService,
    private readonly jwtService: JwtService,
  ) {
    super(database);
  }

  @CatchError()
  async login({ id, name, email, phoneNumber, username }: AppleDto) {
    let user = await this.database.user.findFirst({
      where: {
        authByFacebook: {
          clientId: id,
        },
      },
    });
    if (!user)
      user = await this.database.user.create({
        data: {
          username: await this.generateUsername(),
          name,
          authByFacebook: {
            create: {
              clientId: id,
              email,
              phoneNumber,
              username,
            },
          },
        },
      });

    return {
      token: this.jwtService.sign({ id: user.id }),
      user,
      messages: [languages['login-success']],
    };
  }
}
