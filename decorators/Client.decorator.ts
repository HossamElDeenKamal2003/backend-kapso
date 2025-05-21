import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { CacheService } from 'src/cache/cache.service';
import { DataBaseService } from 'src/database/database.service';

export const Client = createParamDecorator(
  async (
    { idOnly = false }: { idOnly?: boolean } = { idOnly: false },
    ctx: ExecutionContext,
  ) => {
    try {
      isAuthorized(ctx);
      const token = getToken(ctx);
      const { id } = await getClientId(token);
      const userCached = await cacheService.get(id);
      if (userCached) return idOnly ? id : userCached;
      const user = await getClientUser(id);
      const following = user.following.map((f) => f.followingId);
      delete user.following;
      cacheService.set(id, { user, ...following }, 60 * 60 * 24);
      return idOnly ? user.id : { ...user, following };
    } catch (error: any) {
      console.error(error);
      handleError(ctx, error);
    }
  },
);

const databaseService = new DataBaseService(new EventEmitter2());
databaseService.onModuleInit();
const cacheService = new CacheService();
cacheService.onModuleInit();
const jwtService = new JwtService({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '60m' },
});

export const getToken = (ctx: ExecutionContext) => {
  const client: Socket = ctx.switchToWs().getClient();
  const token = client.handshake?.headers['authorization']?.split(' ')?.at(1);
  if (!token) throw new UnauthorizedException('No token provided');
  return token;
};

export const getClientId = async (token: string) => {
  return jwtService.verifyAsync<{ id: string }>(token);
};

export const getClientUser = async (id: string) => {
  return databaseService.user.findUnique({
    where: { id },
    include: {
      following: {
        select: {
          followingId: true,
        },
      },
    },
  });
};

const handleError = (ctx: ExecutionContext, error: any) => {
  const client: Socket = ctx.switchToWs().getClient();
  console.error({ error });
  client.emit('auth-error', {
    messages: [
      { en: error?.message ?? 'Invalid token', ar: 'رمز التشفير غير صالح' },
    ],
  });
  client.disconnect();
};

function isAuthorized(ctx: ExecutionContext) {
  const client: Socket = ctx.switchToWs().getClient();
  const access = client.handshake?.headers['x-server-access'];
  if (access != process.env.SERVER_ACCESS)
    throw new Error('SERVER ACCESS is required');
}
