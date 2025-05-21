import { ArrayMaxSize, IsArray, MaxLength } from 'class-validator';

export type ReelsFilter = 'trend' | 'follower';

export class CreatePostDTO {
  @MaxLength(10024)
  text: string;

  @IsArray()
  @ArrayMaxSize(8)
  images: string[];
}

export class CreateCommentPostDTO {
  @MaxLength(1024)
  content: string;
}
