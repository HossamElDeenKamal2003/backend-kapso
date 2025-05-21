import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { MailStrategy } from './strategies/mail.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { PhoneNumberStrategy } from './strategies/phone-number.strategy';
import { PasswordStrategy } from './strategies/password.strategy';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '360 days' },
    }),
  ],
  providers: [
    AuthService,
    MailStrategy,
    PhoneNumberStrategy,
    GoogleStrategy,
    FacebookStrategy,
    PasswordStrategy,
    AppleStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
