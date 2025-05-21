import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Patch,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { FamilyService } from './family.service';
import { UserDecorator, UserType } from 'decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('family')
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  @Get()
  async getFamily(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('skip', ParseIntPipe) skip: number,
  ) {
    return this.familyService.getFamilies({ limit, skip });
  }

  @Get('my')
  async getMyFamily(@UserDecorator() user: UserType) {
    return this.familyService.getFamily({ where: { id: user.familyId } });
  }

  @Patch('join')
  async joinFamily(
    @UserDecorator() user: User,
    @Body(new ValidationPipe()) { familyId }: { familyId: string },
  ) {
    return this.familyService.joinFamily({ user, familyId });
  }
}
