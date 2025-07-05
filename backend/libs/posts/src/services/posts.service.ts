// Posts Service - xử lý logic nghiệp vụ cho bài viết
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@libs/shared";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách bài viết với phân trang
   * @param params - Tham số tìm kiếm và phân trang
   * @returns Danh sách bài viết
   */
  async findAll(params: { page?: number; limit?: number; threadId?: string }) {
    const { page = 1, limit = 10, threadId } = params;
    const skip = (page - 1) * limit;

    const where = threadId ? { threadId } : {};

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          thread: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: {
              votes: true,
              children: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thông tin chi tiết một bài viết
   * @param id - ID của bài viết
   * @returns Thông tin bài viết
   */
  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        children: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            votes: true,
            children: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Không tìm thấy bài viết");
    }

    return post;
  }

  /**
   * Tạo bài viết mới
   * @param createPostDto - Dữ liệu tạo bài viết
   * @param authorId - ID tác giả
   * @returns Bài viết vừa tạo
   */
  async create(createPostDto: any, authorId: string) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Cập nhật bài viết
   * @param id - ID bài viết
   * @param updatePostDto - Dữ liệu cập nhật
   * @param userId - ID người dùng hiện tại
   * @returns Bài viết sau khi cập nhật
   */
  async update(id: string, updatePostDto: any, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException("Không tìm thấy bài viết");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("Bạn không có quyền chỉnh sửa bài viết này");
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Xóa bài viết
   * @param id - ID bài viết
   * @returns Kết quả xóa
   */
  async remove(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException("Không tìm thấy bài viết");
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: "Xóa bài viết thành công" };
  }
}
