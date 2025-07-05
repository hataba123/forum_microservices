// Service quản lý users
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/shared';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole, UserStatus } from '@libs/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo user mới
  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        role: createUserDto.role || UserRole.USER,
        status: createUserDto.status || UserStatus.ACTIVE,
      },
    });
  }

  // Tìm user theo ID
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Tìm user theo email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Tìm user theo username
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // Tìm user theo email hoặc username
  async findByEmailOrUsername(email: string, username: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });
  }

  // Lấy danh sách users với pagination
  async findMany(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: offset,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Cập nhật user
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // Xóa user (soft delete)
  async remove(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.BANNED,
      },
    });
  }
}
