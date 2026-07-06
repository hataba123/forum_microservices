import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService, SlugUtil, UserRole } from "@libs/shared";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { QueryThreadDto } from "../dto/query-thread.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";

@Injectable()
export class ThreadsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly threadInclude = {
    author: {
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
      },
    },
    category: true,
    _count: {
      select: {
        posts: true,
      },
    },
  };

  private parsePositiveInt(value: string | undefined, fallback: number, max?: number) {
    const parsed = Number.parseInt(value || "", 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }

    return max ? Math.min(parsed, max) : parsed;
  }

  private parseBoolean(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return undefined;
  }

  private isAdminOrModerator(user: any) {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;
  }

  private async getActiveCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new BadRequestException("Category khong ton tai hoac khong active");
    }

    return category;
  }

  private async createUniqueSlug(source: string, excludeThreadId?: string) {
    const baseSlug = SlugUtil.createSlug(source);
    if (!baseSlug) {
      throw new BadRequestException("Slug khong hop le");
    }

    let slug = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.thread.findFirst({
        where: {
          slug,
          ...(excludeThreadId ? { id: { not: excludeThreadId } } : {}),
        },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private appendPostVoteStats(posts: any[] = [], currentUserId?: string) {
    return posts.map((post) => {
      const votes = post.votes || [];
      const upvotes = votes.filter((vote) => vote.value === 1).length;
      const downvotes = votes.filter((vote) => vote.value === -1).length;
      const currentUserVote =
        votes.find((vote) => currentUserId && vote.userId === currentUserId)?.value || 0;
      const { votes: _votes, ...safePost } = post;
      const voteScore = upvotes - downvotes;

      return {
        ...safePost,
        upvotes,
        downvotes,
        voteScore,
        currentUserVote,
        voteStats: {
          upvotes,
          downvotes,
          score: voteScore,
          total: votes.length,
        },
      };
    });
  }

  private appendVoteStats(threads: any[], currentUserId?: string) {
    return threads.map((thread) => {
      const votes = thread.votes || [];
      const upvotes = votes.filter((vote) => vote.value === 1).length;
      const downvotes = votes.filter((vote) => vote.value === -1).length;
      const currentUserVote =
        votes.find((vote) => currentUserId && vote.userId === currentUserId)?.value || 0;
      const { votes: _votes, posts, ...safeThread } = thread;
      const voteScore = upvotes - downvotes;

      return {
        ...safeThread,
        ...(posts ? { posts: this.appendPostVoteStats(posts, currentUserId) } : {}),
        upvotes,
        downvotes,
        voteScore,
        currentUserVote,
        voteStats: {
          upvotes,
          downvotes,
          score: voteScore,
          total: votes.length,
        },
      };
    });
  }

  async create(createThreadDto: CreateThreadDto, user: any) {
    await this.getActiveCategory(createThreadDto.categoryId);

    const slug = await this.createUniqueSlug(createThreadDto.slug || createThreadDto.title);

    return this.prisma.$transaction(async (tx) => {
      const thread = await tx.thread.create({
        data: {
          title: createThreadDto.title,
          slug,
          content: createThreadDto.content,
          authorId: user.id,
          categoryId: createThreadDto.categoryId,
        },
        include: this.threadInclude,
      });

      await tx.post.create({
        data: {
          content: createThreadDto.content,
          authorId: user.id,
          threadId: thread.id,
        },
      });

      return thread;
    });
  }

  async findAll(query: QueryThreadDto = {}, currentUserId?: string) {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = this.parsePositiveInt(query.limit, 20, 100);
    const skip = (page - 1) * limit;
    const isPinned = this.parseBoolean(query.isPinned);

    const where: any = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.categorySlug) {
      where.category = {
        slug: query.categorySlug,
        isActive: true,
      };
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (isPinned !== undefined) {
      where.isPinned = isPinned;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        include: {
          ...this.threadInclude,
          votes: {
            select: {
              userId: true,
              value: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      data: this.appendVoteStats(threads, currentUserId),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, currentUserId?: string) {
    const thread = await this.prisma.thread
      .update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        include: {
          ...this.threadInclude,
          votes: {
            select: {
              userId: true,
              value: true,
            },
          },
          posts: {
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
              _count: {
                select: {
                  votes: true,
                  children: true,
                },
              },
              votes: {
                select: {
                  userId: true,
                  value: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
      .catch(() => null);

    if (!thread) {
      throw new NotFoundException("Khong tim thay thread");
    }

    return this.appendVoteStats([thread], currentUserId)[0];
  }

  async update(id: string, updateThreadDto: UpdateThreadDto, user: any) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException("Khong tim thay thread");
    }

    const isOwner = thread.authorId === user.id;
    const isPrivileged = this.isAdminOrModerator(user);

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException("Ban khong co quyen cap nhat thread nay");
    }

    if (thread.isLocked && !isPrivileged) {
      throw new ForbiddenException("Thread da bi khoa");
    }

    if (updateThreadDto.categoryId) {
      await this.getActiveCategory(updateThreadDto.categoryId);
    }

    const data: any = {
      ...updateThreadDto,
    };

    if (updateThreadDto.slug) {
      data.slug = await this.createUniqueSlug(updateThreadDto.slug, id);
    } else if (updateThreadDto.title && updateThreadDto.title !== thread.title) {
      data.slug = await this.createUniqueSlug(updateThreadDto.title, id);
    }

    const shouldSyncFirstPost = updateThreadDto.content !== undefined;

    return this.prisma.$transaction(async (tx) => {
      const updatedThread = await tx.thread.update({
        where: { id },
        data,
        include: this.threadInclude,
      });

      if (shouldSyncFirstPost) {
        const firstPost = await tx.post.findFirst({
          where: {
            threadId: id,
            parentId: null,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
          },
        });

        if (firstPost) {
          await tx.post.update({
            where: { id: firstPost.id },
            data: { content: updateThreadDto.content },
          });
        }
      }

      return updatedThread;
    });
  }

  async remove(id: string, user: any) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException("Khong tim thay thread");
    }

    const isOwner = thread.authorId === user.id;
    const isPrivileged = this.isAdminOrModerator(user);

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException("Ban khong co quyen xoa thread nay");
    }

    await this.prisma.thread.delete({
      where: { id },
    });

    return { message: "Xoa thread thanh cong" };
  }
}
