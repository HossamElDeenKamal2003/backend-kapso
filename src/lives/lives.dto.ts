import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsIn,
  IsArray,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateLiveDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'SDP is too short to be valid' })
  offer: string;

  title: string;

  tags: string[];

  image: string;

  @IsIn(['video', 'audio', 'radio'])
  liveType: 'video' | 'audio' | 'radio';
}

export class JoinLivesDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'SDP is too short to be valid' })
  offer: string;

  @IsString()
  liveId: string;
}

export class GetLivesDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => [
    ...new Set(value?.split(',').filter((item: string) => item.length > 0)),
  ])
  skipLives: string[];

  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  take: number;

  @IsString()
  @IsOptional()
  tagId?: string;

  @IsOptional()
  @IsIn(['video', 'audio', 'radio', 'all'])
  type: 'video' | 'audio' | 'radio' | 'all';

  @IsIn(['explore', 'followed', 'trendy', 'pk', 'nearby', 'new', 'top_now'])
  sortBy:
    | 'explore'
    | 'followed'
    | 'trendy'
    | 'pk'
    | 'nearby'
    | 'new'
    | 'top_now';
}
