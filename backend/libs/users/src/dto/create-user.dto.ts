// DTO cho tạo user mới
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole, UserStatus } from '@libs/shared';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

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
