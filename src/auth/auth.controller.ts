import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDecorator, UserType } from 'decorators/user.decorator';
import { AuthStrategies } from './dtos/auth.dto';
import { MailRegisterationDto, MailVerificationDto } from './dtos/mail.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: any,
    @Query('strategy', new ParseEnumPipe(AuthStrategies))
    strategy: AuthStrategies,
  ) {
    return this.authService.login(body, strategy);
  }

  @Post('signup')
  async signup(
    @Body() arg: any,
    @Query('strategy', new ParseEnumPipe(AuthStrategies))
    strategy: AuthStrategies,
  ) {
    return this.authService.register(arg, strategy);
  }

  @Post('verify')
  async verify(
    @Body() arg: any,
    @Query('strategy', new ParseEnumPipe(AuthStrategies))
    strategy: AuthStrategies,
  ) {
    return this.authService.verify(arg, strategy);
  }

  @Get()
  async verifyToken(@UserDecorator() user: UserType) {
    return user;
  }
}
