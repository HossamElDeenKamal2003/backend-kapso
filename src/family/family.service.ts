import { Injectable, OnModuleInit } from '@nestjs/common';
import { CatchError } from 'decorators/CatchError.decorator';
import { DataBaseService } from 'src/database/database.service';
import languages from 'languages.json';
import { Prisma, User } from '@prisma/client';
import { formatPrisma } from 'utils/formatPrisma';

@Injectable()
export class FamilyService {
  constructor(private readonly database: DataBaseService) {}

  @CatchError()
  async getFamilies({ limit, skip }: { limit: number; skip: number }) {
    const families = await this.database.family.aggregateRaw({
      pipeline: [
        {
          $lookup: {
            from: 'FamilyMember',
            localField: '_id',
            foreignField: 'familyId',
            as: 'members',
          },
        },
        {
          $unwind: {
            path: '$members',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'User',
            localField: 'members.userId',
            foreignField: '_id',
            as: 'members.user',
          },
        },
        {
          $unwind: {
            path: '$members.user',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            slogan: { $first: '$slogan' },
            announcement: { $first: '$announcement' },
            image: { $first: '$image' },
            minimumLevel: { $first: '$minimumLevel' },
            chatId: { $first: '$chatId' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' },
            totalEarned: { $sum: '$members.earned' },
            members: { $push: '$members' },
          },
        },
        { $sort: { totalEarned: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            slogan: 1,
            announcement: 1,
            image: 1,
            minimumLevel: 1,
            chatId: 1,
            createdAt: 1,
            updatedAt: 1,
            totalEarned: 1,
            members: {
              _id: { $first: '$members._id' },
              userId: { $first: '$members.userId' },
              earned: { $first: '$members.earned' },
              isFounder: { $first: '$members.isFounder' },
              createdAt: { $first: '$members.createdAt' },
              updatedAt: { $first: '$members.updatedAt' },
              user: { $first: '$members.user' },
            },
          },
        },
      ],
    });
    return formatPrisma(families);
  }

  @CatchError()
  async getMyFamily({ userId }: { userId: string }) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { familyMember: { include: { family: true } } },
    });
    if (!user?.familyMember)
      return {
        messages: [
          { content: languages['family-not-found'], isSuccess: false },
          { content: languages['join-to-family'], isSuccess: false },
        ],
      };
    return user?.familyMember;
  }

  @CatchError()
  getFamily({ where }: { where: Prisma.FamilyWhereUniqueInput }) {
    return this.database.family.findUnique({
      where,
      include: { members: { include: { user: true } } },
    });
  }

  @CatchError()
  async joinFamily({ familyId, user }: { familyId: string; user: User }) {
    const existing = await this.database.familyMember.findUnique({
      where: { userId_familyId: { userId: user.id, familyId } },
    });

    if (existing) throw new Error('User is already a member of the family');

    const member = await this.database.familyMember.create({
      data: {
        userId: user.id,
        familyId,
        earned: 0,
        isFounder: false,
      },
      include: {
        user: true,
      },
    });

    return { user: { ...user, familyId }, member };
  }
}
