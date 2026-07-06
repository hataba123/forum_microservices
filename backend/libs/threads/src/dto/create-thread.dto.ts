import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;
}
