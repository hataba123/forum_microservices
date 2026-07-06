import { NotFoundException } from "@nestjs/common";
import { ThreadsService } from "./threads.service";

describe("ThreadsService", () => {
  let service: ThreadsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      category: {
        findFirst: jest.fn(),
      },
      thread: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      post: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new ThreadsService(prisma);
  });

  it("creates a thread and first post in one transaction", async () => {
    const thread = {
      id: "thread-1",
      title: "Hello Forum",
      slug: "hello-forum",
    };

    prisma.category.findFirst.mockResolvedValue({ id: "cat-1", isActive: true });
    prisma.thread.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        thread: {
          create: jest.fn().mockResolvedValue(thread),
        },
        post: {
          create: prisma.post.create.mockResolvedValue({ id: "post-1" }),
        },
      })
    );

    const result = await service.create(
      {
        title: "Hello Forum",
        content: "First post",
        categoryId: "cat-1",
      },
      { id: "user-1", role: "USER" }
    );

    expect(result).toEqual(thread);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        content: "First post",
        authorId: "user-1",
        threadId: "thread-1",
      },
    });
  });

  it("returns paginated threads", async () => {
    prisma.thread.findMany.mockResolvedValue([{ id: "thread-1", votes: [] }]);
    prisma.thread.count.mockResolvedValue(1);

    const result = await service.findAll({ page: "2", limit: "5" });

    expect(prisma.thread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0].currentUserVote).toBe(0);
  });

  it("returns the current user vote for thread reads", async () => {
    prisma.thread.findMany.mockResolvedValue([
      {
        id: "thread-1",
        votes: [
          { userId: "user-1", value: 1 },
          { userId: "user-2", value: -1 },
        ],
      },
    ]);
    prisma.thread.count.mockResolvedValue(1);

    const result = await service.findAll({}, "user-2");

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        upvotes: 1,
        downvotes: 1,
        voteScore: 0,
        currentUserVote: -1,
      })
    );
  });

  it("throws NotFoundException when a thread does not exist", async () => {
    prisma.thread.update.mockRejectedValue(new Error("not found"));

    await expect(service.findById("missing-thread")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("syncs thread content to the first post when updating thread content", async () => {
    const thread = {
      id: "thread-1",
      title: "Old title",
      content: "Old content",
      authorId: "user-1",
      isLocked: false,
    };
    const updatedThread = {
      ...thread,
      title: "New title",
      content: "New content",
    };

    prisma.thread.findUnique.mockResolvedValue(thread);
    prisma.thread.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        thread: {
          update: prisma.thread.update.mockResolvedValue(updatedThread),
        },
        post: {
          findFirst: prisma.post.findFirst.mockResolvedValue({ id: "post-1" }),
          update: prisma.post.update.mockResolvedValue({ id: "post-1" }),
        },
      })
    );

    const result = await service.update(
      "thread-1",
      {
        title: "New title",
        content: "New content",
      },
      { id: "user-1", role: "USER" }
    );

    expect(result).toEqual(updatedThread);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        threadId: "thread-1",
        parentId: null,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    });
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: { content: "New content" },
    });
  });

  it("does not update first post when updating only thread title", async () => {
    const thread = {
      id: "thread-1",
      title: "Old title",
      content: "Same content",
      authorId: "user-1",
      isLocked: false,
    };
    const updatedThread = {
      ...thread,
      title: "New title",
    };

    prisma.thread.findUnique.mockResolvedValue(thread);
    prisma.thread.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        thread: {
          update: prisma.thread.update.mockResolvedValue(updatedThread),
        },
        post: {
          findFirst: prisma.post.findFirst,
          update: prisma.post.update,
        },
      })
    );

    await service.update(
      "thread-1",
      {
        title: "New title",
      },
      { id: "user-1", role: "USER" }
    );

    expect(prisma.post.findFirst).not.toHaveBeenCalled();
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("updates thread content without crashing when first post is missing", async () => {
    const thread = {
      id: "thread-1",
      title: "Title",
      content: "Old content",
      authorId: "user-1",
      isLocked: false,
    };
    const updatedThread = {
      ...thread,
      content: "New content",
    };

    prisma.thread.findUnique.mockResolvedValue(thread);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        thread: {
          update: prisma.thread.update.mockResolvedValue(updatedThread),
        },
        post: {
          findFirst: prisma.post.findFirst.mockResolvedValue(null),
          update: prisma.post.update,
        },
      })
    );

    const result = await service.update(
      "thread-1",
      {
        content: "New content",
      },
      { id: "user-1", role: "USER" }
    );

    expect(result).toEqual(updatedThread);
    expect(prisma.post.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.post.update).not.toHaveBeenCalled();
  });
});
