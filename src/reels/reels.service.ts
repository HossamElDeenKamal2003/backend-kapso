import { Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { DataBaseService } from 'src/database/database.service';
import { ReelsFilter } from './reels.dto';
import { deepCopy } from 'utils/deepCopy';
import { formatPrisma } from 'utils/formatPrisma';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class ReelsService {
  constructor(
    private readonly database: DataBaseService,
    private readonly cacheService: CacheService,
  ) {}

  @CatchError()
  private async prepareReels({
    userId,
    match = {},
    skip,
    limit,
  }: {
    userId: string;
    match?: any;
    limit: number;
    skip: number;
  }) {
    const pipeline = [
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $match: match },
      {
        $lookup: {
          from: 'User',
          localField: 'publisherId',
          foreignField: '_id',
          as: 'publisher',
        },
      },
      {
        $unwind: {
          path: '$publisher',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'ReelLove',
          localField: '_id',
          foreignField: 'reelId',
          as: 'loves',
        },
      },
      {
        $lookup: {
          from: 'ReelSave',
          localField: '_id',
          foreignField: 'reelId',
          as: 'saves',
        },
      },
      {
        $lookup: {
          from: 'ReelComment',
          localField: '_id',
          foreignField: 'reelId',
          as: 'comments',
        },
      },
      {
        $addFields: {
          loves: { $size: '$loves' },
          isUserLove: {
            $in: [
              userId,
              { $map: { input: '$loves.userId', in: { $toString: '$$this' } } },
            ],
          },
          saves: { $size: '$saves' },
          comments: { $size: '$comments' },
          isUserSave: {
            $in: [
              userId,
              { $map: { input: '$saves.userId', in: { $toString: '$$this' } } },
            ],
          },
        },
      },
    ];

    const result = deepCopy(
      await this.database.reel.aggregateRaw({
        pipeline: pipeline,
      }),
    );
    return result.map(formatPrisma);
  }

  @CatchError()
  private async prepareComments({
    userId,
    reelId,
    skip,
    limit,
  }: {
    userId: string;
    reelId: string;
    limit: number;
    skip: number;
  }) {
    const pipeline = [
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$reelId', { $oid: reelId }] },
              { $eq: ['$userId', { $oid: userId }] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'ReelCommentLove',
          localField: '_id',
          foreignField: 'reelCommentId',
          as: 'loves',
        },
      },
      {
        $addFields: {
          loves: { $size: '$loves' },
          isUserLove: {
            $in: [
              userId,
              { $map: { input: '$loves.userId', in: { $toString: '$$this' } } },
            ],
          },
        },
      },
    ];

    const result = deepCopy(
      await this.database.reelComment.aggregateRaw({
        pipeline: pipeline,
      }),
    );
    return result.map(formatPrisma);
  }

  @CatchError()
  async getReels({
    limit,
    skip,
    userId,
    filter,
  }: {
    limit: number;
    skip: number;
    userId: string;
    filter?: ReelsFilter;
  }) {
    let following = 0;
    let remaining = 0;

    if (filter == 'follwing') {
      following == limit;
      remaining = 0;
    } else if (filter == 'trend') {
      following == 0;
      remaining = limit;
    } else {
      following = Math.ceil(limit * 0.8);
      remaining = limit - following;
    }

    let userFollowingIds = await this.cacheService.get<string[]>(
      `${userId}-follwing`,
    );
    if (!userFollowingIds) {
      const followings = await this.database.follower.findMany({
        where: { followerId: userId },
      });
      userFollowingIds = followings.map((following) => following.followingId);
      this.cacheService.set(`${userId}-follwing`, userFollowingIds, 60 * 24);
    }

    const followingReels =
      following == 0
        ? []
        : deepCopy(
            await this.prepareReels({
              limit: following,
              skip,
              userId,
              match: {
                publisherId: { $in: userFollowingIds },
              },
            }),
          )?.map((post: any) => ({
            ...post,
            publisher: { ...post?.publisher, isFollowing: true },
          }));

    const remainingReels =
      remaining == 0
        ? []
        : deepCopy(
            await this.prepareReels({
              limit: remaining,
              skip,
              userId,
              match: {
                publisherId: { $nin: userFollowingIds },
              },
            }),
          )?.map((post: any) => ({
            ...post,
            publisher: { ...post?.publisher, isFollowing: false },
          }));
    return [...followingReels, ...remainingReels].sort(
      (a, b) => Number(a.createdAt) - Number(b.createdAt),
    );
  }

  @CatchError()
  async createReel({
    content,
    url,
    userId,
  }: {
    content: string;
    url: string;
    userId: string;
  }) {
    return this.database.reel.create({
      data: {
        content,
        url,
        publisherId: userId,
      },
    });
  }

  @CatchError()
  async createCommentReel({
    content,
    reelId,
    userId,
  }: {
    content: string;
    reelId: string;
    userId: string;
  }) {
    return this.database.reelComment.create({
      data: { content, reelId, userId },
    });
  }

  @CatchError()
  async getCommentReel({
    reelId,
    userId,
    limit,
    skip,
  }: {
    userId: string;
    reelId: string;
    limit: number;
    skip: number;
  }) {
    return this.prepareComments({
      reelId,
      userId,
      limit,
      skip,
    });
  }

  @CatchError()
  async saveReel({ reelId, userId }: { reelId: string; userId: string }) {
    return this.database.reelSave.create({
      data: { reelId, userId },
    });
  }

  @CatchError()
  async unsaveReel({ reelId, userId }: { reelId: string; userId: string }) {
    return this.database.reelSave.delete({
      where: { reelId_userId: { reelId, userId } },
    });
  }

  @CatchError()
  async loveReel({ reelId, userId }: { reelId: string; userId: string }) {
    return this.database.reelLove.create({
      data: { reelId, userId },
    });
  }

  @CatchError()
  async unloveReel({ reelId, userId }: { reelId: string; userId: string }) {
    return this.database.reelLove.delete({
      where: { reelId_userId: { reelId, userId } },
    });
  }

  @CatchError()
  unloveComment({ userId, commentId }: { userId: string; commentId: string }) {
    return this.database.reelCommentLove.delete({
      where: { reelCommentId_userId: { userId, reelCommentId: commentId } },
    });
  }

  @CatchError()
  loveComment({ userId, commentId }: { userId: string; commentId: string }) {
    return this.database.reelCommentLove.create({
      data: { userId, reelCommentId: commentId },
    });
  }
}
