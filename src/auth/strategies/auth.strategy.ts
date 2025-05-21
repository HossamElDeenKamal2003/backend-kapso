import { DataBaseService } from 'src/database/database.service';
import { CatchError } from 'decorators/CatchError.decorator';
import languages from 'languages.json';
import { AuthStrategies } from '../dtos/auth.dto';

export abstract class AuthStrategy {
  abstract login(arg: any): Promise<any>;
  abstract name: AuthStrategies;
  constructor(private readonly databaseService: DataBaseService) {}

  getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateOtp(length: number) {
    const multiaply = 10 ** (length - 1);
    return Math.floor(multiaply + Math.random() * 9 * multiaply);
  }

  async generateUsername(): Promise<string> {
    const chars = '0123456789';
    let username = '';
    for (let i = 0; i < 6; i++)
      username += chars[this.getRandomNumber(0, chars.length - 1)];
    return (await this.isVaildUsername(username)).vaild
      ? username
      : await this.generateUsername();
  }

  @CatchError()
  async isVaildUsername(username: string) {
    const count = await this.databaseService.user.count({
      where: { username },
    });
    const vaild = count == 0;
    return {
      vaild,
      messages: languages[vaild ? 'vaild-username' : 'invaild-username'],
    };
  }
}
