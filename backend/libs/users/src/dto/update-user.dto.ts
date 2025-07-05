// DTO cho cập nhật user
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole, UserStatus } from '@libs/shared';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
