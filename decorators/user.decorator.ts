import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { DataBaseService } from 'src/database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from 'src/cache/cache.service';
import { UnauthorizedException } from '@nestjs/common';

export type UserType = User & { following: string[]; familyId: string };
export type UserDecoratorReturnType = Promise<UserType | string>;

export const UserDecorator = createParamDecorator(
  async (
    { idOnly = false, role }: { idOnly?: boolean; role?: string } = {
      idOnly: false,
    },
    ctx: ExecutionContext,
  ): UserDecoratorReturnType => {
    try {
      let roleId: string;
      if (role) {
        const { id } = await databaseService.role.findUnique({
          where: { title: role },
        });
        roleId = id;
      }
      const token = getToken(ctx);
      const { id } = await jwtService.verifyAsync<{ id: string }>(token);
      const userCached = (await cacheService.get<UserDecoratorReturnType>(
        id,
      )) as UserType;
      if (userCached) {
        if (!role || userCached?.roleId == roleId)
          return idOnly ? id : userCached;
        else throw new ForbiddenException();
      }
      const user = await databaseService.user.findUnique({
        where: { id },
        include: {
          following: {
            select: {
              followingId: true,
            },
          },
          familyMember: {
            select: {
              familyId: true,
            },
          },
        },
      });
      if (role && user?.roleId != roleId) throw new ForbiddenException();
      const { familyId } = user.familyMember ?? { familyId: null };
      const following = user.following.map((f) => f.followingId);
      delete user.following;
      delete user.familyMember;
      await cacheService.set(
        id,
        { ...user, following, familyId },
        60 * 60 * 24,
      );
      return idOnly ? user.id : { ...user, following, familyId };
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

const getToken = (ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<FastifyRequest>();
  const token = req.headers['authorization']?.split(' ')?.at(1);
  if (!token) throw new UnauthorizedException('No token provided');
  return token;
};

const handleError = (_: ExecutionContext, error: any) => {
  if (error instanceof ForbiddenException) throw new ForbiddenException();
  else throw new UnauthorizedException(error?.message ?? 'Invalid token');
};
