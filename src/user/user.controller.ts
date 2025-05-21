import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { UserDecorator } from 'decorators/user.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Patch('follow/:followingId')
  async follow(
    @Param('followingId') followingId: string,
    @UserDecorator({ idOnly: true }) userId: string,
  ) {
    return this.userService.follow({ followingId, userId });
  }

  @Delete('follow/:followingId')
  async unfollow(
    @Param('followingId') followingId: string,
    @UserDecorator({ idOnly: true }) userId: string,
  ) {
    return this.userService.unfollow({ followingId, userId });
  }

  @Get('followers')
  async getFlowers(
    @UserDecorator({ idOnly: true }) userId: string,
    @Param('take', ParseIntPipe) take: number,
    @Param('skip', ParseIntPipe) skip: number,
    @Param('prompt') prompt: string,
  ) {
    const name = prompt.startsWith('@') ? null : prompt;
    const username = prompt.startsWith('@') ? prompt.slice(1) : null;
    return this.userService.getFlowers({ userId, take, skip, name, username });
  }

  @Get('followings')
  async getFlowings(
    @UserDecorator({ idOnly: true }) userId: string,
    @Param('take', ParseIntPipe) take: number,
    @Param('skip', ParseIntPipe) skip: number,
    @Param('prompt') prompt: string,
  ) {
    const name = prompt.startsWith('@') ? null : prompt;
    const username = prompt.startsWith('@') ? prompt.slice(1) : null;
    return this.userService.getFlowings({ userId, take, skip, name, username });
  }

  @Get('friends')
  async getFriends(
    @UserDecorator({ idOnly: true }) userId: string,
    @Query('take', ParseIntPipe) take: number,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('prompt') prompt: string,
  ) {
    const name = prompt.startsWith('@') || prompt.length == 0 ? null : prompt;
    const username =
      prompt.startsWith('@') && prompt.length > 1 ? prompt.slice(1) : null;
    return this.userService.getFriends({ userId, take, skip, name, username });
  }
}
