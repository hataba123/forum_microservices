import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@libs/shared";
import { PostsService } from "./posts.service";

describe("PostsService", () => {
  let service: PostsService;
  let prisma: any;

  const user = { id: "user-1", role: UserRole.USER };
  const otherUser = { id: "user-2", role: UserRole.USER };
  const admin = { id: "admin-1", role: UserRole.ADMIN };

  beforeEach(() => {
    prisma = {
      thread: {
        findUnique: jest.fn(),
      },
      post: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new PostsService(prisma);
  });

  it("creates a post when the thread exists", async () => {
    prisma.thread.findUnique.mockResolvedValue({ id: "thread-1", isLocked: false });
    prisma.post.create.mockResolvedValue({
      id: "post-1",
      content: "Hello",
      votes: [],
    });

    const result = await service.create(
      { threadId: "thread-1", content: " Hello " },
      user
    );

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          content: "Hello",
          threadId: "thread-1",
          parentId: undefined,
          authorId: "user-1",
        },
      })
    );
    expect(result.voteScore).toBe(0);
  });

  it("creates a reply when the parent belongs to the same thread", async () => {
    prisma.thread.findUnique.mockResolvedValue({ id: "thread-1", isLocked: false });
    prisma.post.findUnique.mockResolvedValue({ id: "parent-1", threadId: "thread-1" });
    prisma.post.create.mockResolvedValue({
      id: "reply-1",
      parentId: "parent-1",
      votes: [],
    });

    await service.create(
      { threadId: "thread-1", parentId: "parent-1", content: "Reply" },
      user
    );

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentId: "parent-1",
        }),
      })
    );
  });

  it("rejects a reply when the parent belongs to another thread", async () => {
    prisma.thread.findUnique.mockResolvedValue({ id: "thread-1", isLocked: false });
    prisma.post.findUnique.mockResolvedValue({ id: "parent-1", threadId: "thread-2" });

    await expect(
      service.create(
        { threadId: "thread-1", parentId: "parent-1", content: "Reply" },
        user
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("updates a post by its author", async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      authorId: "user-1",
      thread: { id: "thread-1", isLocked: false },
    });
    prisma.post.update.mockResolvedValue({
      id: "post-1",
      content: "Updated",
      votes: [{ userId: "user-1", value: 1 }],
    });

    const result = await service.update("post-1", { content: " Updated " }, user);

    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { content: "Updated" },
      })
    );
    expect(result.currentUserVote).toBe(1);
  });

  it("rejects update by another normal user", async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      authorId: "user-1",
      thread: { id: "thread-1", isLocked: false },
    });

    await expect(
      service.update("post-1", { content: "Updated" }, otherUser)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("deletes a post by an admin", async () => {
    prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      authorId: "user-1",
      thread: { id: "thread-1", isLocked: false },
      _count: { children: 0 },
    });
    prisma.post.delete.mockResolvedValue({ id: "post-1" });

    const result = await service.remove("post-1", admin);

    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
    expect(result).toEqual({ message: "Xoa bai viet thanh cong" });
  });

  it("returns paginated posts", async () => {
    prisma.post.findMany.mockResolvedValue([{ id: "post-1", votes: [] }]);
    prisma.post.count.mockResolvedValue(1);

    const result = await service.findAll({
      threadId: "thread-1",
      page: "2",
      limit: "5",
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { threadId: "thread-1" },
        skip: 5,
        take: 5,
        orderBy: { createdAt: "asc" },
      })
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 1,
      pages: 1,
      totalPages: 1,
    });
  });

  it("throws NotFoundException when a post does not exist", async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(service.findOne("missing-post")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
