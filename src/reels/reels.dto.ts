import { IsIn, IsUrl, MaxLength } from 'class-validator';

export type ReelsFilter = 'trend' | 'follwing' | 'all';

export class CreateReelDTO {
  @MaxLength(1024)
  content: string;
  @IsUrl()
  url: string;
}

export class CreateCommentReelDTO {
  @MaxLength(1024)
  content: string;
}
