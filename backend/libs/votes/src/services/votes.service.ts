// Votes Service - xử lý logic nghiệp vụ cho vote
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@libs/shared";
import { VoteType } from "@prisma/client";

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vote cho thread hoặc post
   * @param voteDto - Dữ liệu vote
   * @param userId - ID người vote
   * @returns Kết quả vote
   */
  async vote(
    voteDto: { targetId: string; type: VoteType; value: number },
    userId: string
  ) {
    const { targetId, type, value } = voteDto;

    // Validate value (chỉ cho phép 1 hoặc -1)
    if (value !== 1 && value !== -1) {
      throw new BadRequestException(
        "Giá trị vote phải là 1 (upvote) hoặc -1 (downvote)"
      );
    }

    // Kiểm tra target tồn tại
    if (type === VoteType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
      if (!post) {
        throw new NotFoundException("Không tìm thấy bài viết");
      }
    } else if (type === VoteType.THREAD) {
      const thread = await this.prisma.thread.findUnique({
        where: { id: targetId },
      });
      if (!thread) {
        throw new NotFoundException("Không tìm thấy chủ đề");
      }
    }

    // Kiểm tra vote hiện tại
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_targetId_type: {
          userId,
          targetId,
          type,
        },
      },
    });

    if (existingVote) {
      // Nếu vote giống nhau thì xóa vote
      if (existingVote.value === value) {
        await this.prisma.vote.delete({
          where: { id: existingVote.id },
        });
        return { message: "Đã hủy vote", voted: false };
      } else {
        // Nếu khác thì update
        await this.prisma.vote.update({
          where: { id: existingVote.id },
          data: { value },
        });
        return { message: "Đã cập nhật vote", voted: true, value };
      }
    } else {
      // Tạo vote mới
      await this.prisma.vote.create({
        data: {
          userId,
          targetId,
          type,
          value,
        },
      });
      return { message: "Vote thành công", voted: true, value };
    }
  }

  /**
   * Hủy vote
   * @param targetId - ID target
   * @param type - Loại vote
   * @param userId - ID người dùng
   * @returns Kết quả hủy vote
   */
  async removeVote(targetId: string, type: VoteType, userId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: {
        userId_targetId_type: {
          userId,
          targetId,
          type,
        },
      },
    });

    if (!vote) {
      throw new NotFoundException("Không tìm thấy vote");
    }

    await this.prisma.vote.delete({
      where: { id: vote.id },
    });

    return { message: "Hủy vote thành công" };
  }

  /**
   * Lấy thống kê vote của target
   * @param targetId - ID target
   * @param type - Loại vote
   * @returns Thống kê vote
   */
  async getVoteStats(targetId: string, type: VoteType) {
    const votes = await this.prisma.vote.findMany({
      where: { targetId, type },
    });

    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;
    const score = upvotes - downvotes;

    return {
      upvotes,
      downvotes,
      score,
      total: votes.length,
    };
  }

  /**
   * Lấy vote của user cho target cụ thể
   * @param targetId - ID target
   * @param type - Loại vote
   * @param userId - ID user
   * @returns Vote của user
   */
  async getUserVote(targetId: string, type: VoteType, userId: string) {
    return this.prisma.vote.findUnique({
      where: {
        userId_targetId_type: {
          userId,
          targetId,
          type,
        },
      },
    });
  }
}
