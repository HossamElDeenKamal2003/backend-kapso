import { Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { DataBaseService } from 'src/database/database.service';

export enum NotificationType {
  CALL = 'CALL',
  MESSAGE = 'MESSAGE',
  ALERT = 'ALERT',
  CUSTOM = 'CUSTOM',
}

type NotificationOptions = {
  title?: string;
  data?: any;
  sound?: 'default' | 'call' | 'alert' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string; // For Android
  _override?: ExpoPushMessage; // Advanced override
};

@Injectable()
export class NotificationsService {
  private expo: Expo;

  constructor(private readonly database: DataBaseService) {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true,
    });
  }

  addToken({ token, userId }: { token: string; userId: string }) {
    return this.database.notificationToken.upsert({
      where: { token },
      create: { userId, token },
      update: { userId },
    });
  }

  removeToken({ token }: { token: string }) {
    return this.database.notificationToken.delete({
      where: { token },
    });
  }

  removeTokenOfUser({ userId }: { userId: string }) {
    return this.database.notificationToken.deleteMany({
      where: { userId },
    });
  }

  seen({ userId }: { userId: string }) {
    return this.database.user.update({
      where: { id: userId },
      data: { lastNotificationsSeen: new Date() },
    });
  }

  getNotifications({
    skip,
    userId,
    type,
    take,
  }: {
    skip: number;
    userId: string;
    type: string;
    take: number;
  }) {
    return this.database.notification.findMany({
      take,
      skip,
      where: {
        type,
        users: {
          some: {
            userId,
          },
        },
      },
    });
  }

  @CatchError()
  async sendNotificationByTokens({
    tokens,
    message,
    ...options
  }: NotificationOptions & {
    tokens: string[];
    message: string;
  }): Promise<void> {
    try {
      const messages: ExpoPushMessage[] = tokens.map((token) => ({
        ...options,
        to: token,
        body: message,
      }));
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        receipts.forEach(async (receipt) => {
          if (
            receipt.status == 'error' &&
            receipt.details.error == 'DeviceNotRegistered'
          )
            await this.removeToken({
              token: receipt.details.expoPushToken,
            });
        });
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw new Error('Failed to send notifications');
    }
  }

  @CatchError()
  async sendNotificationByUsers({
    userIds,
    message,
    ...options
  }: NotificationOptions & {
    userIds: string[];
    message: string;
  }): Promise<void> {
    try {
      const tokens = await this.database.notificationToken.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
        select: {
          token: true,
        },
      });
      return this.sendNotificationByTokens({
        tokens: tokens.map(({ token }) => token),
        message,
        ...options,
      });
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw new Error('Failed to send notifications');
    }
  }
}
