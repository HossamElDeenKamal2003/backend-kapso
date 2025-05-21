import { Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { DataBaseService } from 'src/database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly database: DataBaseService) {}

  private condition({ name, value }: { name: string; value: string }) {
    return (
      value && {
        [name]: { contains: value, mode: 'insensitive' },
      }
    );
  }

  @CatchError()
  async follow({
    followingId,
    userId,
  }: {
    followingId: string;
    userId: string;
  }) {
    return this.database.follower.create({
      data: { followerId: userId, followingId },
    });
  }

  @CatchError()
  async unfollow({
    followingId,
    userId,
  }: {
    followingId: string;
    userId: string;
  }) {
    return this.database.follower.delete({
      where: { followerId_followingId: { followerId: userId, followingId } },
    });
  }

  @CatchError()
  async getFlowers({
    userId,
    take,
    skip,
    name,
    username,
  }: {
    userId: string;
    take: number;
    skip: number;
    name?: string;
    username?: string;
  }) {
    return this.database.follower.findMany({
      take,
      skip,
      where: {
        follower: {
          ...this.condition({ name: 'name', value: name }),
          ...this.condition({ name: 'username', value: username }),
        },
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            birthDate: true,
            gender: true,
            lastConnect: true,
          },
        },
      },
    });
  }

  @CatchError()
  async getFlowings({
    userId,
    take,
    skip,
    name,
    username,
  }: {
    userId: string;
    take: number;
    skip: number;
    name?: string;
    username?: string;
  }) {
    return this.database.follower.findMany({
      take,
      skip,
      where: {
        following: {
          ...this.condition({ name: 'name', value: name }),
          ...this.condition({ name: 'username', value: username }),
        },
        followerId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            birthDate: true,
            gender: true,
            lastConnect: true,
          },
        },
      },
    });
  }

  @CatchError()
  async getFriends({
    userId,
    take,
    skip,
    name,
    username,
  }: {
    userId: string;
    take: number;
    skip: number;
    name?: string;
    username?: string;
  }) {
    return this.database.user.findMany({
      take,
      skip,
      where: {
        id: { not: userId },
        AND: [
          {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
          {
            following: {
              some: {
                followingId: userId,
              },
            },
          },
        ],
        ...this.condition({ name: 'name', value: name }),
        ...this.condition({ name: 'username', value: username }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        birthDate: true,
        gender: true,
        lastConnect: true,
        chats: {
          where: {
            chat: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
    });
  }

  async isFriends(userId1: string, userId2: string) {
    const count = await this.database.user.count({
      where: {
        id: userId1,
        AND: [
          {
            followers: {
              some: {
                followerId: userId2,
              },
            },
          },
          {
            following: {
              some: {
                followingId: userId2,
              },
            },
          },
        ],
      },
    });
    return count > 0;
  }
}
