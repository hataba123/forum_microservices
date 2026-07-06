import { BadRequestException, NotFoundException } from "@nestjs/common";
import { VoteType } from "@prisma/client";
import { VotesService } from "./votes.service";

describe("VotesService", () => {
  let service: VotesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      post: {
        findUnique: jest.fn(),
      },
      thread: {
        findUnique: jest.fn(),
      },
      vote: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new VotesService(prisma);
  });

  function mockStatsAndUserVote(value: number | null = 1) {
    prisma.vote.findMany.mockResolvedValue([{ value: 1 }]);
    prisma.vote.findUnique.mockResolvedValueOnce(null);
    if (value === null) {
      prisma.vote.findUnique.mockResolvedValueOnce(null);
    } else {
      prisma.vote.findUnique.mockResolvedValueOnce({ value });
    }
  }

  it("creates a post vote", async () => {
    prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    mockStatsAndUserVote(1);
    prisma.vote.create.mockResolvedValue({ id: "vote-1" });

    const result = await service.vote(
      { type: VoteType.POST, postId: "post-1", value: 1 },
      "user-1"
    );

    expect(prisma.vote.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: VoteType.POST,
        value: 1,
        postId: "post-1",
        threadId: undefined,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        voted: true,
        value: 1,
        targetType: VoteType.POST,
        targetId: "post-1",
      })
    );
  });

  it("toggles off a vote with the same value", async () => {
    prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    prisma.vote.findUnique.mockResolvedValueOnce({ id: "vote-1", value: 1 });
    prisma.vote.findMany.mockResolvedValue([]);
    prisma.vote.findUnique.mockResolvedValueOnce(null);

    const result = await service.vote(
      { type: VoteType.POST, postId: "post-1", value: 1 },
      "user-1"
    );

    expect(prisma.vote.delete).toHaveBeenCalledWith({ where: { id: "vote-1" } });
    expect(result).toEqual(
      expect.objectContaining({
        voted: false,
        value: 0,
        score: 0,
      })
    );
  });

  it("updates a vote with the opposite value", async () => {
    prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    prisma.vote.findUnique.mockResolvedValueOnce({ id: "vote-1", value: 1 });
    prisma.vote.findMany.mockResolvedValue([{ value: -1 }]);
    prisma.vote.findUnique.mockResolvedValueOnce({ value: -1 });

    const result = await service.vote(
      { type: VoteType.POST, postId: "post-1", value: -1 },
      "user-1"
    );

    expect(prisma.vote.update).toHaveBeenCalledWith({
      where: { id: "vote-1" },
      data: { value: -1 },
    });
    expect(result).toEqual(
      expect.objectContaining({
        voted: true,
        value: -1,
        score: -1,
      })
    );
  });

  it("creates a thread vote", async () => {
    prisma.thread.findUnique.mockResolvedValue({ id: "thread-1" });
    mockStatsAndUserVote(1);
    prisma.vote.create.mockResolvedValue({ id: "vote-1" });

    const result = await service.vote(
      { type: VoteType.THREAD, threadId: "thread-1", value: 1 },
      "user-1"
    );

    expect(prisma.vote.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: VoteType.THREAD,
        value: 1,
        postId: undefined,
        threadId: "thread-1",
      },
    });
    expect(result.targetType).toBe(VoteType.THREAD);
  });

  it("rejects POST votes without postId", async () => {
    await expect(
      service.vote({ type: VoteType.POST, value: 1 }, "user-1")
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects THREAD votes without threadId", async () => {
    await expect(
      service.vote({ type: VoteType.THREAD, value: 1 }, "user-1")
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws NotFoundException for missing targets", async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(
      service.vote({ type: VoteType.POST, postId: "missing", value: 1 }, "user-1")
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
