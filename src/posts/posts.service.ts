import { Injectable } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { DataBaseService } from 'src/database/database.service';
import languages from 'languages.json';
import { Prisma } from '@prisma/client';
import { deepCopy } from 'utils/deepCopy';
import { formatPrisma } from 'utils/formatPrisma';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly database: DataBaseService,
    private readonly cacheService: CacheService,
  ) {}

  @CatchError()
  private async preparePosts({
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
      { $unwind: { path: '$publisher', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'PostLove',
          localField: '_id',
          foreignField: 'postId',
          as: 'loves',
        },
      },
      {
        $lookup: {
          from: 'PostSave',
          localField: '_id',
          foreignField: 'postId',
          as: 'saves',
        },
      },
      {
        $lookup: {
          from: 'PostComment',
          localField: '_id',
          foreignField: 'postId',
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
      await this.database.post.aggregateRaw({ pipeline: pipeline }),
    );
    return result.map(formatPrisma);
  }

  @CatchError()
  private async prepareComments({
    userId,
    postId,
    skip,
    limit,
  }: {
    userId: string;
    postId: string;
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
              { $eq: ['$postId', { $oid: postId }] },
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
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'PostCommentLove',
          localField: '_id',
          foreignField: 'postCommentId',
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
      await this.database.postComment.aggregateRaw({ pipeline: pipeline }),
    );
    return result.map(formatPrisma);
  }

  @CatchError()
  async getPosts({
    limit,
    skip,
    userId,
  }: {
    limit: number;
    skip: number;
    userId: string;
  }) {
    const following = Math.floor(limit * 0.8);
    const remaining = limit - following;
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
    const followingPosts =
      following == 0
        ? []
        : deepCopy(
            await this.preparePosts({
              limit: following,
              skip,
              userId,
              match: { publisherId: { $in: userFollowingIds } },
            }),
          )?.map((post: any) => ({
            ...post,
            publisher: { ...post?.publisher, isFollowing: true },
          }));

    const remainingPosts =
      remaining == 0
        ? []
        : deepCopy(
            await this.preparePosts({
              limit: remaining,
              skip,
              userId,
              match: { publisherId: { $nin: userFollowingIds } },
            }),
          )?.map((post: any) => ({
            ...post,
            publisher: { ...post?.publisher, isFollowing: true },
          }));
    return [...followingPosts, ...remainingPosts].sort(
      (a, b) => Number(a.createdAt) - Number(b.createdAt),
    );
  }

  @CatchError()
  async createPost({
    text,
    images,
    userId,
  }: {
    text?: string;
    images?: string[];
    userId: string;
  }) {
    const post = await this.database.post.create({
      data: { content: { text, images }, publisherId: userId },
      include: {
        publisher: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    });
    return {
      post: {
        ...post,
        loves: 0,
        saves: 0,
        comments: 0,
        isUserSaved: false,
        isUserLoves: false,
        postComments: [],
      },
      messages: [{ content: languages['post-created'], isSuccess: true }],
    };
  }

  @CatchError()
  async createCommentPost({
    content,
    postId,
    userId,
  }: {
    content: string;
    postId: string;
    userId: string;
  }) {
    return this.database.postComment.create({
      data: { content, postId, userId },
    });
  }

  @CatchError()
  async getCommentPost({
    postId,
    limit,
    skip,
    userId,
  }: {
    userId: string;
    postId: string;
    limit: number;
    skip: number;
  }) {
    return this.prepareComments({ postId, limit, skip, userId });
  }

  @CatchError()
  async savePost({ postId, userId }: { postId: string; userId: string }) {
    return this.database.postSave.create({ data: { postId, userId } });
  }

  @CatchError()
  async unsavePost({ postId, userId }: { postId: string; userId: string }) {
    return this.database.postSave.delete({
      where: { postId_userId: { postId, userId } },
    });
  }

  @CatchError()
  async lovePost({ postId, userId }: { postId: string; userId: string }) {
    return this.database.postLove.create({ data: { postId, userId } });
  }

  @CatchError()
  async unlovePost({ postId, userId }: { postId: string; userId: string }) {
    return this.database.postLove.delete({
      where: { postId_userId: { postId, userId } },
    });
  }

  @CatchError()
  async loveCommentPost({
    userId,
    commentId,
  }: {
    userId: string;
    commentId: string;
  }) {
    return this.database.postCommentLove.create({
      data: { postCommentId: commentId, userId },
    });
  }

  @CatchError()
  async unloveCommentPost({
    userId,
    commentId,
  }: {
    userId: string;
    commentId: string;
  }) {
    return this.database.postCommentLove.delete({
      where: { postCommentId_userId: { postCommentId: commentId, userId } },
    });
  }
}
