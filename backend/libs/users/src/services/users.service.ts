// Service quan ly users
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/shared';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole, UserStatus } from '@libs/shared';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private removePassword(user: any) {
    if (!user) {
      return user;
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  // Tao user moi
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role || UserRole.USER,
        status: createUserDto.status || UserStatus.ACTIVE,
      },
    });

    return this.removePassword(user);
  }

  // Tim user theo ID, dung cho API response nen khong tra password
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return this.removePassword(user);
  }

  // Tim user theo email, dung noi bo cho auth nen can password de compare
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Tim user theo username
  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return this.removePassword(user);
  }

  // Tim user theo email hoac username
  async findByEmailOrUsername(email: string, username: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    return this.removePassword(user);
  }

  // Lay danh sach users voi pagination
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

  // Cap nhat user
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User khong ton tai');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return this.removePassword(updatedUser);
  }

  // Xoa user (soft delete)
  async remove(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User khong ton tai');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.BANNED,
      },
    });

    return this.removePassword(updatedUser);
  }
}
