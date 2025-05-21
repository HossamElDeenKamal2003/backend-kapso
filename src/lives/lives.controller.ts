import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LivesService } from './lives.service';
import { CreateLiveDto, GetLivesDto, JoinLivesDto } from './lives.dto';
import { UserDecorator } from 'decorators/user.decorator';
import { Cache } from 'decorators/cache.decorator';
import { User } from '@prisma/client';

@Controller('lives')
export class LivesController {
  constructor(private readonly livesService: LivesService) {}

  @Get()
  @Cache(0)
  async getLives(
    @Query() { skipLives, take, tagId, type, sortBy }: GetLivesDto,
  ) {
    const lives = await this.livesService.getLives({
      skipLives,
      take,
      tagId,
      type,
      sortBy,
    });
    return lives.map((live) => {
      const members = live?.room?._count?.members;
      delete live.room;
      return {
        ...live,
        members,
      };
    });
  }

  @Post()
  async createLive(
    @Body() { offer, title, tags, image, liveType }: CreateLiveDto,
    @UserDecorator() user: User,
  ) {
    return this.livesService.createLive(user, {
      offer,
      title,
      tags,
      image,
      liveType,
    });
  }

  @Post('join')
  async joinRoom(
    @UserDecorator() user: User,
    @Body() { offer, liveId }: JoinLivesDto,
  ) {
    return this.livesService.joinLive(user, { offer, liveId });
  }

  @Get('tags')
  async getTags() {
    return this.livesService.getTags();
  }
}
