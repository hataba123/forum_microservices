import { VoteType } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";

export class CreateVoteDto {
  @IsEnum(VoteType)
  type: VoteType;

  @IsIn([1, -1])
  value: 1 | -1;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  threadId?: string;
}
