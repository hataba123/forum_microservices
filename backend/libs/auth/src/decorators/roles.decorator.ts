// Decorator để chỉ định roles cho endpoint
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@libs/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
