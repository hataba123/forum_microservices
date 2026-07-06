import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService, UserRole } from "@libs/shared";
import { CreatePostDto } from "../dto/create-post.dto";
import { QueryPostsDto } from "../dto/query-posts.dto";
import { UpdatePostDto } from "../dto/update-post.dto";

export interface AuthenticatedUser {
  id: string;
  role?: UserRole | string;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly authorSelect = {
    id: true,
    username: true,
    email: true,
    avatar: true,
    role: true,
  } as const;

  private readonly threadSelect = {
    id: true,
    title: true,
    slug: true,
    isLocked: true,
  } as const;

  private parsePositiveInt(value: string | number | undefined, fallback: number, max?: number) {
    const parsed = Number.parseInt(String(value || ""), 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }

    return max ? Math.min(parsed, max) : parsed;
  }

  private isAdminOrModerator(user: AuthenticatedUser) {
    return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
  }

  private normalizeContent(content: string | undefined) {
    const trimmed = content?.trim();
    if (!trimmed) {
      throw new BadRequestException("Post content khong duoc rong");
    }

    return trimmed;
  }

  private appendVoteStats(posts: any[], currentUserId?: string) {
    return posts.map((post) => this.appendVoteStatsToPost(post, currentUserId));
  }

  private appendVoteStatsToPost(post: any, currentUserId?: string) {
    const votes = post.votes || [];
    const upvotes = votes.filter((vote) => vote.value === 1).length;
    const downvotes = votes.filter((vote) => vote.value === -1).length;
    const currentUserVote =
      votes.find((vote) => currentUserId && vote.userId === currentUserId)?.value || 0;
    const { votes: _votes, children, ...safePost } = post;
    const voteScore = upvotes - downvotes;

    return {
      ...safePost,
      ...(children ? { children: this.appendVoteStats(children, currentUserId) } : {}),
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
  }

  async findAll(query: QueryPostsDto = {}, currentUserId?: string) {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = this.parsePositiveInt(query.limit, 20, 100);
    const skip = (page - 1) * limit;
    const sortDirection = query.sort || (query.threadId ? "oldest" : "newest");

    const where: Prisma.PostWhereInput = {};

    if (query.threadId) {
      where.threadId = query.threadId;
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: this.authorSelect,
          },
          thread: {
            select: this.threadSelect,
          },
          parent: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
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
        orderBy: { createdAt: sortDirection === "oldest" ? "asc" : "desc" },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: this.appendVoteStats(posts, currentUserId),
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        totalPages,
      },
    };
  }

  async findOne(id: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: this.authorSelect,
        },
        thread: {
          select: this.threadSelect,
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
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
                role: true,
              },
            },
            thread: {
              select: this.threadSelect,
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
    });

    if (!post) {
      throw new NotFoundException("Khong tim thay bai viet");
    }

    return this.appendVoteStatsToPost(post, currentUserId);
  }

  async create(createPostDto: CreatePostDto, user: AuthenticatedUser) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: createPostDto.threadId },
      select: {
        id: true,
        isLocked: true,
      },
    });

    if (!thread) {
      throw new NotFoundException("Khong tim thay thread");
    }

    if (thread.isLocked && !this.isAdminOrModerator(user)) {
      throw new ForbiddenException("Thread da bi khoa");
    }

    if (createPostDto.parentId) {
      const parent = await this.prisma.post.findUnique({
        where: { id: createPostDto.parentId },
        select: {
          id: true,
          threadId: true,
        },
      });

      if (!parent) {
        throw new NotFoundException("Khong tim thay post cha");
      }

      if (parent.threadId !== createPostDto.threadId) {
        throw new BadRequestException("Post cha khong thuoc cung thread");
      }
    }

    const post = await this.prisma.post.create({
      data: {
        content: this.normalizeContent(createPostDto.content),
        threadId: createPostDto.threadId,
        parentId: createPostDto.parentId,
        authorId: user.id,
      },
      include: {
        author: {
          select: this.authorSelect,
        },
        thread: {
          select: this.threadSelect,
        },
        parent: {
          select: {
            id: true,
            content: true,
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
    });

    return this.appendVoteStatsToPost(post, user.id);
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: AuthenticatedUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        thread: {
          select: {
            id: true,
            isLocked: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Khong tim thay bai viet");
    }

    const isOwner = post.authorId === user.id;
    const isPrivileged = this.isAdminOrModerator(user);

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException("Ban khong co quyen chinh sua bai viet nay");
    }

    if (post.thread.isLocked && !isPrivileged) {
      throw new ForbiddenException("Thread da bi khoa");
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        content: this.normalizeContent(updatePostDto.content),
      },
      include: {
        author: {
          select: this.authorSelect,
        },
        thread: {
          select: this.threadSelect,
        },
        parent: {
          select: {
            id: true,
            content: true,
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
    });

    return this.appendVoteStatsToPost(updated, user.id);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        thread: {
          select: {
            id: true,
            isLocked: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Khong tim thay bai viet");
    }

    const isOwner = post.authorId === user.id;
    const isPrivileged = this.isAdminOrModerator(user);

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException("Ban khong co quyen xoa bai viet nay");
    }

    if (post.thread.isLocked && !isPrivileged) {
      throw new ForbiddenException("Thread da bi khoa");
    }

    if (post._count.children > 0) {
      throw new BadRequestException("Khong the xoa bai viet da co replies");
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: "Xoa bai viet thanh cong" };
  }
}
