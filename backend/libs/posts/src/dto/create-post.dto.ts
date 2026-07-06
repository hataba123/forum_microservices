import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parentId?: string;
}
