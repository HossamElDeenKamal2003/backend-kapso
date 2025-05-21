import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppService {
  private readonly apiVersion = 'v13.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendMessage({ phoneNumber, text }) {
    const phoneNumberId = this.configService.get<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
    );
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: text,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers }).pipe(
          catchError((error) => {
            throw new HttpException(
              error.response?.data?.error?.message || 'WhatsApp API error',
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
