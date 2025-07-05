// DTO cho response user
import { UserRole, UserStatus } from '@libs/shared';

export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
