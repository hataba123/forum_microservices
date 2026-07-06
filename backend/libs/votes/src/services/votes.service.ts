import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { VoteType } from "@prisma/client";
import { PrismaService } from "@libs/shared";
import { CreateVoteDto } from "../dto/create-vote.dto";

interface VoteTarget {
  targetId: string;
  targetType: VoteType;
  postId?: string;
  threadId?: string;
}

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateValue(value: number) {
    if (value !== 1 && value !== -1) {
      throw new BadRequestException("Gia tri vote phai la 1 hoac -1");
    }
  }

  private validateTarget(voteDto: CreateVoteDto): VoteTarget {
    const hasPostId = Boolean(voteDto.postId);
    const hasThreadId = Boolean(voteDto.threadId);

    if (hasPostId && hasThreadId) {
      throw new BadRequestException("Chi duoc gui postId hoac threadId");
    }

    if (voteDto.type === VoteType.POST) {
      if (!voteDto.postId || hasThreadId) {
        throw new BadRequestException("postId la bat buoc khi type la POST");
      }

      return {
        targetId: voteDto.postId,
        targetType: VoteType.POST,
        postId: voteDto.postId,
      };
    }

    if (voteDto.type === VoteType.THREAD) {
      if (!voteDto.threadId || hasPostId) {
        throw new BadRequestException("threadId la bat buoc khi type la THREAD");
      }

      return {
        targetId: voteDto.threadId,
        targetType: VoteType.THREAD,
        threadId: voteDto.threadId,
      };
    }

    throw new BadRequestException("Loai vote khong hop le");
  }

  private buildWhere(target: VoteTarget) {
    return target.targetType === VoteType.POST
      ? { postId: target.postId, type: VoteType.POST }
      : { threadId: target.threadId, type: VoteType.THREAD };
  }

  private buildUniqueWhere(userId: string, target: VoteTarget) {
    return target.targetType === VoteType.POST
      ? {
          userId_postId: {
            userId,
            postId: target.postId,
          },
        }
      : {
          userId_threadId: {
            userId,
            threadId: target.threadId,
          },
        };
  }

  private async ensureTargetExists(target: VoteTarget) {
    if (target.targetType === VoteType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: target.postId },
        select: { id: true },
      });

      if (!post) {
        throw new NotFoundException("Khong tim thay bai viet");
      }

      return;
    }

    const thread = await this.prisma.thread.findUnique({
      where: { id: target.threadId },
      select: { id: true },
    });

    if (!thread) {
      throw new NotFoundException("Khong tim thay thread");
    }
  }

  private async buildVoteResponse(target: VoteTarget, userId: string, voted: boolean, value: number) {
    const stats = await this.getVoteStats(target.targetId, target.targetType);
    const userVote = await this.getUserVote(target.targetId, target.targetType, userId);

    return {
      voted,
      value: userVote?.value || value,
      targetType: target.targetType,
      targetId: target.targetId,
      ...stats,
    };
  }

  async vote(voteDto: CreateVoteDto, userId: string) {
    this.validateValue(voteDto.value);
    const target = this.validateTarget(voteDto);
    await this.ensureTargetExists(target);

    const existingVote = await this.prisma.vote.findUnique({
      where: this.buildUniqueWhere(userId, target),
    });

    if (existingVote) {
      if (existingVote.value === voteDto.value) {
        await this.prisma.vote.delete({
          where: { id: existingVote.id },
        });

        return this.buildVoteResponse(target, userId, false, 0);
      }

      await this.prisma.vote.update({
        where: { id: existingVote.id },
        data: { value: voteDto.value },
      });

      return this.buildVoteResponse(target, userId, true, voteDto.value);
    }

    await this.prisma.vote.create({
      data: {
        userId,
        type: target.targetType,
        value: voteDto.value,
        postId: target.postId,
        threadId: target.threadId,
      },
    });

    return this.buildVoteResponse(target, userId, true, voteDto.value);
  }

  async removeVote(targetId: string, type: VoteType, userId: string) {
    const target =
      type === VoteType.POST
        ? { targetId, targetType: VoteType.POST, postId: targetId }
        : { targetId, targetType: VoteType.THREAD, threadId: targetId };

    if (type !== VoteType.POST && type !== VoteType.THREAD) {
      throw new BadRequestException("Loai vote khong hop le");
    }

    const vote = await this.prisma.vote.findUnique({
      where: this.buildUniqueWhere(userId, target),
    });

    if (!vote) {
      throw new NotFoundException("Khong tim thay vote");
    }

    await this.prisma.vote.delete({
      where: { id: vote.id },
    });

    return this.buildVoteResponse(target, userId, false, 0);
  }

  async getVoteStats(targetId: string, type: VoteType) {
    const votes = await this.prisma.vote.findMany({
      where:
        type === VoteType.POST
          ? { postId: targetId, type: VoteType.POST }
          : { threadId: targetId, type: VoteType.THREAD },
      select: {
        value: true,
      },
    });

    const upvotes = votes.filter((vote) => vote.value === 1).length;
    const downvotes = votes.filter((vote) => vote.value === -1).length;

    return {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      total: votes.length,
    };
  }

  async getUserVote(targetId: string, type: VoteType, userId: string) {
    return this.prisma.vote.findUnique({
      where:
        type === VoteType.POST
          ? {
              userId_postId: {
                userId,
                postId: targetId,
              },
            }
          : {
              userId_threadId: {
                userId,
                threadId: targetId,
              },
            },
    });
  }
}
