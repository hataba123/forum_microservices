import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}
