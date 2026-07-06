import { IsIn, IsOptional, IsString } from "class-validator";

export class QueryPostsDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  @IsIn(["newest", "oldest"])
  sort?: "newest" | "oldest";
}
