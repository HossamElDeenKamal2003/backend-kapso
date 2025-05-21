import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';

@Module({
  imports: [DatabaseModule],
  providers: [FamilyService],
  controllers: [FamilyController],
})
export class FamilyModule {}
