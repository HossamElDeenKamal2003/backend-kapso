import { Injectable } from '@nestjs/common';
import { DataBaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { AuthStrategy } from './auth.strategy';
import { AuthStrategies } from '../dtos/auth.dto';
import languages from 'languages.json';
import { PasswordDto } from '../dtos/password.dto';
import { CatchError } from 'decorators/CatchError.decorator';

@Injectable()
export class PasswordStrategy extends AuthStrategy {
  name: AuthStrategies = AuthStrategies.Password;
  constructor(
    private readonly database: DataBaseService,
    private readonly jwtService: JwtService,
  ) {
    super(database);
  }

  @CatchError()
  async login({ id, password }: PasswordDto) {
    const user = await this.database.user.findUnique({
      where: {
        username: id,
      },
      include: {
        authByPassword: true,
      },
    });

    if (!user)
      return {
        messages: [
          { content: languages['login-id-not-found'], isSuccess: false },
        ],
      };

    if (user.authByPassword.password != password)
      return {
        messages: [
          { content: languages['login-password-incorrect'], isSuccess: false },
        ],
      };

    return {
      token: this.jwtService.sign({ id: user.id }),
      user,
      messages: [{ content: languages['login-success'], isSuccess: true }],
    };
  }
}
